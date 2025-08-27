import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@carcosa/database";
import { encryptWithKey } from "../crypto.js";
import Env from "../config/env.js";
import { bucketsService } from "../services/buckets.service.js";

const createBucketSchema = z.object({
  name: z.string().min(1, "Bucket name is required"),
  provider: z.enum(["s3", "r2"], {
    errorMap: () => ({ message: "Provider must be s3 or r2" }),
  }),
  bucketName: z.string().min(1, "Bucket name is required"),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
});

// Use global AuthRequest type

export async function list(req: Request, res: Response) {
  try {
    console.log("📦 Buckets list called");
    console.log("👤 User ID:", req.userId);
    
    if (!req.userId) {
      console.log("❌ No userId in request");
      return res.status(401).json({ error: "unauthorized" });
    }

    console.log("🔍 Querying database for accessible buckets...");
    const buckets = await bucketsService.listAccessibleBuckets(req.userId);

    console.log("✅ Found buckets:", buckets.length);
    console.log("📋 Buckets data:", buckets);
    res.json({ buckets });
  } catch (error) {
    console.error("❌ List buckets error:", error);
    res.status(500).json({ error: "failed_to_list_buckets" });
  }
}

export async function get(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucketId = req.params.id;
    if (!bucketId) {
      return res.status(400).json({ error: "bucket_id_required" });
    }

    const bucket = await bucketsService.getBucketById(bucketId, req.userId);
    res.json(bucket);
  } catch (error) {
    if (error instanceof Error && error.message === "bucket_not_found") {
      return res.status(404).json({ error: "bucket_not_found" });
    }
    console.error("Get bucket error:", error);
    res.status(500).json({ error: "failed_to_get_bucket" });
  }
}

export async function validateCredentials(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucketId = req.params.id;
    if (!bucketId) {
      return res.status(400).json({ error: "bucket_id_required" });
    }

        const bucket = await prisma.bucket.findFirst({
      where: {
        id: bucketId,
        OR: [
          {
            ownerTeam: {
              members: {
                some: { userId: req.userId }
              }
            }
          },
          {
            sharedTeams: {
              some: {
                team: {
                  members: {
                    some: { userId: req.userId }
                  }
                }
              }
            }
          }
        ]
      },
    });

    if (!bucket) {
      return res.status(404).json({ error: "bucket_not_found" });
    }

    // Update status to testing
    await prisma.bucket.update({
      where: { id: bucket.id },
      data: {
        status: "testing",
        lastChecked: new Date(),
      },
    });

    try {
      const adapter = await (
        await import("../services/storage.service.js")
      ).getAdapterForBucket(bucketId!);

      // Try listing objects first
      try {
        await adapter.listObjects("_carcosa_probe/");

        // Update status to connected
        await prisma.bucket.update({
          where: { id: bucket.id },
          data: {
            status: "connected",
            lastChecked: new Date(),
          },
        });

        return res.json({
          ok: true,
          method: "listObjects",
          status: "connected",
        });
      } catch (listError) {
        // If listing fails, try creating a signed URL
        const probe = `_carcosa_probe/${Date.now()}`;
        await adapter.getSignedPutUrl(probe, {
          contentType: "application/octet-stream",
        });

        // Update status to connected
        await prisma.bucket.update({
          where: { id: bucket.id },
          data: {
            status: "connected",
            lastChecked: new Date(),
          },
        });

        return res.json({
          ok: true,
          method: "getSignedPutUrl",
          status: "connected",
        });
      }
    } catch (e: any) {
      // Update status to error
      await prisma.bucket.update({
        where: { id: bucket.id },
        data: {
          status: "error",
          lastChecked: new Date(),
        },
      });

      return res.status(400).json({
        ok: false,
        error: String(e?.message ?? e),
        status: "error",
      });
    }
  } catch (error) {
    console.error("Validate bucket credentials error:", error);
    res.status(500).json({ error: "validation_failed" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = createBucketSchema.parse(req.body);
    const env = Env.parse(process.env);
    const { teamId } = req.query; // Get teamId from query parameters

    if (!teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    // Check if user has access to the team (is a member)
    const teamAccess = await prisma.teamMember.findFirst({
      where: { 
        teamId: teamId as string, 
        userId: req.userId,
        role: { in: ["OWNER", "ADMIN"] } // Only owners and admins can create buckets
      },
    });

    if (!teamAccess) {
      return res.status(403).json({ error: "team_access_denied" });
    }

    // Use the buckets service to create the bucket
    const bucketData = {
      name: body.name,
      provider: body.provider,
      bucketName: body.bucketName,
      region: body.region ?? null,
      endpoint: body.endpoint ?? null,
      encryptedAccessKey: await encryptWithKey(
        env.CREDENTIALS_ENCRYPTION_KEY,
        body.accessKeyId
      ),
      encryptedSecretKey: await encryptWithKey(
        env.CREDENTIALS_ENCRYPTION_KEY,
        body.secretAccessKey
      ),
      status: "pending",
    };

    const bucket = await bucketsService.createBucket(bucketData, teamId as string, req.userId);

    res.status(201).json({ bucket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "validation_failed",
        details: error.errors,
      });
    }
    console.error("Create bucket error:", error);
    res.status(500).json({ error: "bucket_creation_failed" });
  }
}

export async function deleteBucket(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucket = await prisma.bucket.findFirst({
      where: {
        id: req.params.id,
        ownerTeam: { 
          members: { 
            some: { 
              userId: req.userId,
              role: { in: ["OWNER", "ADMIN"] } // Only owners and admins can delete buckets
            } 
          } 
        },
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!bucket) {
      return res.status(404).json({ error: "bucket_not_found" });
    }

    // Check if bucket is being used by any projects
    if (bucket._count.projects > 0) {
      return res.status(400).json({
        error: "bucket_in_use",
        message: `Cannot delete bucket. It is currently being used by ${bucket._count.projects} project(s).`,
      });
    }

    // Delete bucket
    await prisma.bucket.delete({
      where: { id: bucket.id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete bucket error:", error);
    res.status(500).json({ error: "bucket_deletion_failed" });
  }
}

// Grant team access to bucket
export async function grantTeamAccess(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucketId = req.params.bucketId;
    const { teamId, accessLevel } = req.body;

    if (!bucketId) {
      return res.status(400).json({ error: "bucket_id_required" });
    }

    if (!teamId || !accessLevel) {
      return res.status(400).json({ error: "team_id_and_access_level_required" });
    }

    const access = await bucketsService.grantTeamAccess(bucketId, teamId, accessLevel, req.userId);
    res.json({ access });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "insufficient_permissions") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "bucket_not_found") {
        return res.status(404).json({ error: "bucket_not_found" });
      }
    }
    console.error("Grant team access error:", error);
    res.status(500).json({ error: "failed_to_grant_access" });
  }
}

// Revoke team access to bucket
export async function revokeTeamAccess(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucketId = req.params.bucketId;
    const teamId = req.params.teamId;

    if (!bucketId) {
      return res.status(400).json({ error: "bucket_id_required" });
    }

    if (!teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    await bucketsService.revokeTeamAccess(bucketId, teamId, req.userId);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "insufficient_permissions") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "cannot_revoke_owner_access") {
        return res.status(400).json({ error: "cannot_revoke_owner_access" });
      }
      if (error.message === "bucket_not_found") {
        return res.status(404).json({ error: "bucket_not_found" });
      }
    }
    console.error("Revoke team access error:", error);
    res.status(500).json({ error: "failed_to_revoke_access" });
  }
}

// Get available teams for bucket sharing
export async function getAvailableTeams(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const bucketId = req.params.bucketId;
    if (!bucketId) {
      return res.status(400).json({ error: "bucket_id_required" });
    }

    const teams = await bucketsService.getAvailableTeamsForBucket(bucketId, req.userId);
    res.json({ teams });
  } catch (error) {
    if (error instanceof Error && error.message === "bucket_not_found") {
      return res.status(404).json({ error: "bucket_not_found" });
    }
    console.error("Get available teams error:", error);
    res.status(500).json({ error: "failed_to_get_available_teams" });
  }
}

// Get buckets accessible to a specific team (for project creation)
export async function getTeamBuckets(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const teamId = req.params.teamId;
    if (!teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }
    const buckets = await bucketsService.getTeamAccessibleBuckets(teamId, req.userId);
    res.json({ buckets });
  } catch (error) {
    if (error instanceof Error && error.message === "team_access_denied") {
      return res.status(403).json({ error: "team_access_denied" });
    }
    console.error("Get team buckets error:", error);
    res.status(500).json({ error: "failed_to_get_team_buckets" });
  }
}
