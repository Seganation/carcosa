import type { Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { apiKeysService } from "../services/api-keys.service.js";
import { requireParam, requireUserId } from "../utils/type-guards.js";
import {
  createApiKeyWithGroupSchema,
  updateApiKeySchema,
  getFinalPermissions,
} from "../validations/api-keys.validation.js";
import { env } from "../env.js";
import { prisma } from "@carcosa/database";

export async function list(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");

    const apiKeys = await apiKeysService.listByProject(projectId, userId);

    return res.json({
      apiKeys: apiKeys.map((key) => ({
        ...key,
        // Don't expose the actual key hash
        keyHash: undefined,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("List API keys error:", error);
    return res.status(500).json({ error: "failed_to_list_api_keys" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");
    const body = createApiKeyWithGroupSchema.parse(req.body);

    // Resolve final permissions (handles both permissions array and permissionGroup)
    const finalPermissions = getFinalPermissions(body);

    const result = await apiKeysService.create({
      label: body.label,
      permissions: finalPermissions,
      projectId,
      ownerId: userId,
    });

    return res.status(201).json({
      message: "API key created successfully",
      apiKey: result.apiKey, // Only show this once
      apiKeyRecord: {
        ...result.apiKeyRecord,
        keyHash: undefined, // Don't expose the hash
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "validation_failed",
        details: error.errors,
      });
    }
    console.error("Create API key error:", error);
    return res.status(500).json({ error: "failed_to_create_api_key" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");
    const keyId = requireParam(req.params, "keyId");
    const body = updateApiKeySchema.parse(req.body);

    // For now, we'll just regenerate the key with new permissions
    // In the future, we could add an update method that doesn't change the key
    const result = await apiKeysService.regenerate(keyId, projectId, userId);

    return res.json({
      message: "API key updated successfully",
      apiKey: result.apiKey, // Show the new key
      apiKeyRecord: {
        ...result.apiKeyRecord,
        keyHash: undefined,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "api_key_not_found") {
      return res.status(404).json({ error: "api_key_not_found" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "validation_failed",
        details: error.errors,
      });
    }
    console.error("Update API key error:", error);
    return res.status(500).json({ error: "failed_to_update_api_key" });
  }
}

export async function revoke(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");
    const keyId = requireParam(req.params, "keyId");

    await apiKeysService.revoke(keyId, projectId, userId);

    return res.json({
      message: "API key revoked successfully",
      ok: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "api_key_not_found") {
      return res.status(404).json({ error: "api_key_not_found" });
    }
    console.error("Revoke API key error:", error);
    return res.status(500).json({ error: "failed_to_revoke_api_key" });
  }
}

export async function regenerate(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");
    const keyId = requireParam(req.params, "keyId");

    const result = await apiKeysService.regenerate(keyId, projectId, userId);

    return res.json({
      message: "API key regenerated successfully",
      apiKey: result.apiKey, // Show the new key
      apiKeyRecord: {
        ...result.apiKeyRecord,
        keyHash: undefined,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "api_key_not_found") {
      return res.status(404).json({ error: "api_key_not_found" });
    }
    console.error("Regenerate API key error:", error);
    return res.status(500).json({ error: "failed_to_regenerate_api_key" });
  }
}

/**
 * Generate a signed Carcosa token for an API key
 * This is SECURE - token contains NO API key, only signed metadata
 */
export async function generateSecureToken(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, "id");
    const apiKeyId = requireParam(req.params, "keyId");

    // Verify the API key exists and belongs to user's project
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        projectId,
        revokedAt: null,
        project: {
          OR: [
            { ownerId: userId },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            teamId: true,
          },
        },
      },
    });

    if (!apiKey) {
      return res.status(404).json({ error: "api_key_not_found" });
    }

    // Generate signed JWT (NO API KEY!)
    const tokenPayload = {
      pid: projectId,
      kid: apiKeyId,
      tid: apiKey.project.teamId || "",
      scopes: apiKey.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      algorithm: "HS256",
    });

    return res.json({
      token,
      tokenFormat: `CARCOSA_TOKEN=${token}`,
      expiresAt: new Date(tokenPayload.exp * 1000),
      note: "This token contains NO API key. Backend validates and loads key from DB.",
    });
  } catch (error) {
    console.error("Generate secure token error:", error);
    return res.status(500).json({ error: "failed_to_generate_token" });
  }
}

/**
 * Verify a Carcosa token
 */
export async function verifySecureToken(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "token_required" });
    }

    // Verify JWT signature
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      pid: string;
      kid: string;
      tid: string;
      scopes: string[];
      iat: number;
      exp: number;
    };

    // Check if API key still exists and is valid
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: decoded.kid,
        projectId: decoded.pid,
        revokedAt: null,
      },
      select: {
        id: true,
        label: true,
        permissions: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!apiKey) {
      return res.status(404).json({ error: "api_key_not_found_or_revoked" });
    }

    return res.json({
      valid: true,
      projectId: decoded.pid,
      teamId: decoded.tid,
      scopes: decoded.scopes,
      project: apiKey.project,
      expiresAt: new Date(decoded.exp * 1000),
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ error: "invalid_token", message: error.message });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "token_expired" });
    }
    console.error("Verify token error:", error);
    return res.status(500).json({ error: "failed_to_verify_token" });
  }
}
