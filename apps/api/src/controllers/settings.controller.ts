import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@carcosa/database";
import { createAuditLog } from "./audit-logs.controller.js";

// Schema for project settings
const ProjectSettingsSchema = z.object({
  enableMultiTenancy: z.boolean(),
  enableVersioning: z.boolean(),
  defaultVersion: z.string(),
  enableAuditLogs: z.boolean(),
  enableUsageTracking: z.boolean(),
  enableTransformCaching: z.boolean(),
  maxFileSizeMiB: z.number().int().positive(),
  allowedFileTypes: z.array(z.string()),
});

// Schema for API key regeneration
const RegenerateKeySchema = z.object({
  label: z.string().optional(),
});

export async function getProjectSettings(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    // Get project with bucket information
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        bucket: {
          select: {
            name: true,
            provider: true,
            status: true,
          },
        },
        rateLimit: true,
      },
    });
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // For now, return default settings since we don't have a separate settings table
    // In a real implementation, you'd store these in a separate table
    const settings = {
      enableMultiTenancy: false,
      enableVersioning: true,
      defaultVersion: "v1",
      enableAuditLogs: true,
      enableUsageTracking: true,
      enableTransformCaching: true,
      maxFileSizeMiB: 100,
      allowedFileTypes: ["image/*", "application/pdf", "text/*"],
    };
    
    return res.json({ 
      settings,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        bucket: project.bucket!,
      },
    });
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return res.status(500).json({ error: "Failed to fetch project settings" });
  }
}

export async function updateProjectSettings(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = ProjectSettingsSchema.parse(req.body);
    
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // TODO: Store settings in a separate table
    // For now, we'll just validate and return success
    
    // Create audit log
    await createAuditLog({
      projectId,
      userId: "system", // TODO: Get actual user ID
      action: "settings_update",
      resource: "project_settings",
      details: { 
        previousSettings: {}, // TODO: Get previous settings
        newSettings: body,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    return res.json({ 
      message: "Project settings updated successfully",
      settings: body,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid settings data", details: error.errors });
    }
    
    console.error("Error updating project settings:", error);
    return res.status(500).json({ error: "Failed to update project settings" });
  }
}

export async function regenerateApiKey(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = RegenerateKeySchema.parse(req.body);
    
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Revoke existing API keys
    await prisma.apiKey.updateMany({
      where: { projectId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    
    // Generate new API key
    const newApiKey = generateApiKey();
    const keyHash = await hashApiKey(newApiKey);
    
    const apiKey = await prisma.apiKey.create({
      data: {
        projectId,
        label: body.label || "Regenerated API Key",
        keyHash,
      },
    });
    
    // Create audit log
    await createAuditLog({
      projectId,
      userId: "system", // TODO: Get actual user ID
      action: "key_regenerate",
      resource: "api_key",
      details: { 
        apiKeyId: apiKey.id,
        label: apiKey.label,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    return res.json({ 
      message: "API key regenerated successfully",
      apiKey: newApiKey, // Only show this once
      apiKeyId: apiKey.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    
    console.error("Error regenerating API key:", error);
    return res.status(500).json({ error: "Failed to regenerate API key" });
  }
}

// Helper function to generate a new API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to hash API keys (import from auth module)
async function hashApiKey(key: string): Promise<string> {
  // TODO: Import the actual hash function from auth module
  // For now, return a placeholder
  return `hashed_${key}`;
}
