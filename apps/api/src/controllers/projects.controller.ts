import type { Request, Response } from "express";
import { projectsService } from "../services/projects.service.js";
import { createProjectSchema } from "../validations/projects.validation.js";
import { prisma } from "@carcosa/database";
import { requireParam, requireUserId } from "../utils/type-guards.js";

// Use global Request interface

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projects = await projectsService.listByOwner(req.userId);
    res.json({ projects });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({ error: "failed_to_list_projects" });
  }
}

export async function listByTeam(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = requireUserId(req);
    const teamId = requireParam(req.params, 'teamId');
    
    const projects = await projectsService.listByTeam(teamId, userId);
    res.json({ projects });
  } catch (error) {
    if (error instanceof Error && error.message === "team_access_denied") {
      return res.status(403).json({ error: "team_access_denied" });
    }
    console.error("List team projects error:", error);
    res.status(500).json({ error: "failed_to_list_team_projects" });
  }
}

export async function get(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    
    const project = await projectsService.getById(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: "project_not_found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "failed_to_get_project" });
  }
}

export async function validateCredentials(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    const project = await projectsService.getById(projectId, userId);
    
    if (!project) {
      return res.status(404).json({ error: "project_not_found" });
    }

    // Update bucket status to testing
    await prisma.bucket.update({
      where: { id: project.bucket.id },
      data: {
        status: "testing",
        lastChecked: new Date(),
      },
    });

    try {
      const adapter = await (
        await import("../services/storage.service.js")
      ).getAdapterForProject(projectId);

      // Try listing objects first
      try {
        await adapter.listObjects(project.slug + "/");

        // Update bucket status to connected
        await prisma.bucket.update({
          where: { id: project.bucket.id },
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
        const probe = `${project.slug}/_carcosa_probe/${Date.now()}`;
        await adapter.getSignedPutUrl(probe, {
          contentType: "application/octet-stream",
        });

        // Update bucket status to connected
        await prisma.bucket.update({
          where: { id: project.bucket.id },
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
      // Update bucket status to error
      await prisma.bucket.update({
        where: { id: project.bucket.id },
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
    console.error("Validate credentials error:", error);
    res.status(500).json({ error: "validation_failed" });
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = createProjectSchema.parse(req.body);
    const { teamId } = req.query; // Allow teamId to be passed as query parameter
    
    const project = await projectsService.create(body, req.userId, teamId as string);
    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "slug_already_exists") {
        return res.status(400).json({ error: "slug_already_exists" });
      }
      if (error.message === "bucket_not_found") {
        return res.status(400).json({ error: "bucket_not_found" });
      }
      if (error.message === "team_access_denied") {
        return res.status(403).json({ error: "team_access_denied" });
      }
    }
    console.error("Create project error:", error);
    res.status(500).json({ error: "project_creation_failed" });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    const body = createProjectSchema.partial().parse(req.body);
    
    const project = await projectsService.update(projectId, body, userId);
    res.json({ project });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "project_not_found") {
        return res.status(404).json({ error: "project_not_found" });
      }
      if (error.message === "insufficient_permissions") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
    }
    console.error("Update project error:", error);
    res.status(500).json({ error: "project_update_failed" });
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    
    await projectsService.delete(projectId, userId);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "project_not_found") {
        return res.status(404).json({ error: "project_not_found" });
      }
      if (error.message === "insufficient_permissions") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
    }
    console.error("Delete project error:", error);
    res.status(500).json({ error: "project_deletion_failed" });
  }
}

// Team-scoped resource controllers
export async function getTeamTenants(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!req.params.teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    const tenants = await projectsService.getTeamTenants(req.params.teamId, req.userId);
    res.json({ tenants });
  } catch (error) {
    console.error("Get team tenants error:", error);
    res.status(500).json({ error: "failed_to_get_team_tenants" });
  }
}

export async function getTeamTransforms(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!req.params.teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    const transforms = await projectsService.getTeamTransforms(req.params.teamId, req.userId);
    res.json({ transforms });
  } catch (error) {
    console.error("Get team transforms error:", error);
    res.status(500).json({ error: "failed_to_get_team_transforms" });
  }
}

export async function getTeamUsage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!req.params.teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    const usage = await projectsService.getTeamUsage(req.params.teamId, req.userId);
    res.json({ usage });
  } catch (error) {
    console.error("Get team usage error:", error);
    res.status(500).json({ error: "failed_to_get_team_usage" });
  }
}

export async function getTeamAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!req.params.teamId) {
      return res.status(400).json({ error: "team_id_required" });
    }

    const auditLogs = await projectsService.getTeamAuditLogs(req.params.teamId, req.userId);
    res.json({ auditLogs });
  } catch (error) {
    console.error("Get team audit logs error:", error);
    res.status(500).json({ error: "failed_to_get_team_audit_logs" });
  }
}
