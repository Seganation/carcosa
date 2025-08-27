import type { Request, Response } from "express";
import { filesService } from "../services/files.service.js";
import { listFilesSchema, deleteFilesSchema } from "../validations/files.validation.js";

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

    const query = listFilesSchema.parse({
      tenantId: req.query.tenant as string,
      version: req.query.version as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    const result = await filesService.listFiles(query, projectId, req.userId);
    // Serialize BigInt values to string for JSON response
    const serializedResult = JSON.parse(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value));
    return res.json(serializedResult);
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("List files error:", error);
    return res.status(500).json({ error: "failed_to_list_files" });
  }
}

export async function download(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { fileId } = req.params;
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    if (!fileId) {
      return res.status(400).json({ error: "file_id_required" });
    }

    console.log(`🔍 Download request - fileId: ${fileId}, projectId: ${projectId}`);

    const file = await filesService.getFileById(fileId, projectId, req.userId);

    if (!file) {
      console.log(`❌ File not found - fileId: ${fileId}`);
      return res.status(404).json({ error: "file_not_found" });
    }

    console.log(`📁 File found - path: ${file.path}, size: ${file.size}`);
    const signedUrl = await filesService.getSignedUrl(file.path, projectId, req.userId, "get");
    console.log(`✅ Signed URL generated successfully`);

    return res.json({ url: signedUrl });
  } catch (error) {
    console.error("🚨 Download file error:", error);
    
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "file_not_found") {
      return res.status(404).json({ error: "file_not_found" });
    }
    return res.status(500).json({ error: "failed_to_get_download_url" });
  }
}

export async function del(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = deleteFilesSchema.parse(req.body);
    const result = await filesService.deleteFiles(body, projectId, req.userId);
    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("Delete files error:", error);
    return res.status(500).json({ error: "failed_to_delete_files" });
  }
}




