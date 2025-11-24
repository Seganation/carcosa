import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { tokensService } from "../services/tokens.service.js";
import { createTokenSchema } from "../validations/tokens.validation.js";
import { env } from "../env.js";
import { prisma } from "@carcosa/database";

// Use global Request interface

export async function list(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const tokens = await tokensService.listByProject(projectId, req.userId);
    return res.json({ tokens });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("List tokens error:", error);
    return res.status(500).json({ error: "failed_to_list_tokens" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = createTokenSchema.parse(req.body);
    const token = await tokensService.create(body, projectId, req.userId);
    const { token: tokenValue, ...tokenData } = token;
    return res.status(201).json({ token: tokenValue, ...tokenData });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("Create token error:", error);
    return res.status(500).json({ error: "failed_to_create_token" });
  }
}

export async function revoke(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    const keyId = req.params.keyId;

    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    if (!keyId) {
      return res.status(400).json({ error: "key_id_required" });
    }

    await tokensService.revoke(keyId, projectId, req.userId);
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "token_not_found") {
      return res.status(404).json({ error: "token_not_found" });
    }
    console.error("Revoke token error:", error);
    return res.status(500).json({ error: "failed_to_revoke_token" });
  }
}

/**
 * Generate a signed Carcosa token for an API key
 * This is SECURE - token contains NO API key, only signed metadata
 */
export async function generateSecureToken(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.projectId;
    const apiKeyId = req.params.keyId;

    if (!projectId || !apiKeyId) {
      return res.status(400).json({ error: "project_id_and_key_id_required" });
    }

    // Verify the API key exists and belongs to user's project
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        projectId,
        revokedAt: null,
        project: {
          OR: [
            { ownerId: req.userId },
            {
              team: {
                members: {
                  some: { userId: req.userId },
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
