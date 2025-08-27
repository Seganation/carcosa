import type { Request, Response } from "express";
import { tokensService } from "../services/tokens.service.js";
import { createTokenSchema } from "../validations/tokens.validation.js";

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


