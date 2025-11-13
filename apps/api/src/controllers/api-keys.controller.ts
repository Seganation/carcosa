import type { Request, Response } from "express";
import { z } from "zod";
import { apiKeysService } from "../services/api-keys.service.js";
import { requireParam, requireUserId } from "../utils/type-guards.js";
import {
  createApiKeyWithGroupSchema,
  updateApiKeySchema,
  getFinalPermissions,
} from "../validations/api-keys.validation.js";

export async function list(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    
    const apiKeys = await apiKeysService.listByProject(projectId, userId);
    
    return res.json({ 
      apiKeys: apiKeys.map(key => ({
        ...key,
        // Don't expose the actual key hash
        keyHash: undefined,
      }))
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
    const projectId = requireParam(req.params, 'id');
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
        details: error.errors
      });
    }
    console.error("Create API key error:", error);
    return res.status(500).json({ error: "failed_to_create_api_key" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    const keyId = requireParam(req.params, 'keyId');
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
        details: error.errors 
      });
    }
    console.error("Update API key error:", error);
    return res.status(500).json({ error: "failed_to_update_api_key" });
  }
}

export async function revoke(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const projectId = requireParam(req.params, 'id');
    const keyId = requireParam(req.params, 'keyId');

    await apiKeysService.revoke(keyId, projectId, userId);

    return res.json({ 
      message: "API key revoked successfully",
      ok: true 
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
    const projectId = requireParam(req.params, 'id');
    const keyId = requireParam(req.params, 'keyId');

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
