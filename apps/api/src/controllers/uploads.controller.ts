import type { Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { uploadsService } from "../services/uploads.service.js";
import type { InitUploadInput, UploadCallbackInput } from "../validations/uploads.validation.js";
import { initUploadSchema, uploadCallbackSchema } from "../validations/uploads.validation.js";

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    projectId: string;
    label?: string;
    permissions: string[];
  };
  projectId?: string;
}

export async function initUpload(req: ApiKeyRequest, res: Response) {
  try {
    // API key validation is now handled by middleware
    if (!req.apiKey || !req.projectId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = initUploadSchema.parse(req.body);
    const result = await uploadsService.initUpload(body, req.projectId, req.apiKey!.id);

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ 
        error: "validation_failed", 
        details: error.message 
      });
    }
    
    if (error instanceof Error) {
      switch (error.message) {
        case "invalid_api_key":
          return res.status(401).json({ error: "invalid_api_key" });
        case "insufficient_permissions":
          return res.status(403).json({ error: "insufficient_permissions" });
        case "project_not_found":
          return res.status(404).json({ error: "project_not_found" });
        case "project_has_no_bucket":
          return res.status(400).json({ error: "project_has_no_bucket" });
        case "project_slug_not_found":
          return res.status(400).json({ error: "project_slug_not_found" });
        default:
          console.error("Init upload error:", error);
          return res.status(500).json({ error: "upload_initiation_failed" });
      }
    }
    console.error("Init upload error:", error);
    return res.status(500).json({ error: "upload_initiation_failed" });
  }
}

export async function confirmUpload(req: ApiKeyRequest, res: Response) {
  try {
    // API key validation is now handled by middleware
    if (!req.apiKey || !req.projectId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = uploadCallbackSchema.parse(req.body);
    const result = await uploadsService.confirmUpload(body, req.projectId, req.apiKey!.id);

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ 
        error: "validation_failed", 
        details: error.message 
      });
    }
    
    if (error instanceof Error) {
      switch (error.message) {
        case "invalid_api_key":
          return res.status(401).json({ error: "invalid_api_key" });
        case "insufficient_permissions":
          return res.status(403).json({ error: "insufficient_permissions" });
        case "project_not_found":
          return res.status(404).json({ error: "project_not_found" });
        case "upload_not_found":
          return res.status(404).json({ error: "upload_not_found" });
        default:
          console.error("Confirm upload error:", error);
          return res.status(500).json({ error: "upload_confirmation_failed" });
      }
    }
    console.error("Confirm upload error:", error);
    return res.status(500).json({ error: "upload_confirmation_failed" });
  }
}

export async function proxyUpload(req: ApiKeyRequest, res: Response) {
  try {
    // API key validation is now handled by middleware
    if (!req.apiKey || !req.projectId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const result = await uploadsService.proxyUpload(req, req.projectId, req.apiKey!.id);
    return res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "upload_not_found":
          return res.status(404).json({ error: "upload_not_found" });
        case "project_not_found":
          return res.status(404).json({ error: "project_not_found" });
        case "missing_file":
          return res.status(400).json({ error: "missing_file" });
        default:
          console.error("Proxy upload error:", error);
          return res.status(500).json({ error: "upload_failed" });
      }
    }
    console.error("Proxy upload error:", error);
    return res.status(500).json({ error: "upload_failed" });
  }
}

export async function listUploads(req: ApiKeyRequest, res: Response) {
  try {
    // API key validation is now handled by middleware
    if (!req.apiKey || !req.projectId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const uploads = await uploadsService.listUploads(req.projectId, req.apiKey!.id);

    return res.json({ uploads });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "invalid_api_key":
          return res.status(401).json({ error: "invalid_api_key" });
        case "insufficient_permissions":
          return res.status(403).json({ error: "insufficient_permissions" });
        default:
          console.error("List uploads error:", error);
          return res.status(500).json({ error: "failed_to_list_uploads" });
      }
    }
    console.error("List uploads error:", error);
    return res.status(500).json({ error: "failed_to_list_uploads" });
  }
}




