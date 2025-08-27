import { prisma } from "@carcosa/database";
import type { InitUploadInput, UploadCallbackInput } from "../validations/uploads.validation.js";
import { getAdapterForProject, getAdapterForBucket } from "./storage.service.js";
import { checkProjectRateLimit, bumpUsage } from "./rate.service.js";
import { apiKeysService } from "./api-keys.service.js";
import { generateFilePath, generateUploadPath, type ProjectContext } from "../utils/file-paths.js";

export class UploadsService {
  async initUpload(data: InitUploadInput, projectId: string, apiKeyId: string) {
    console.log("🚀 Init upload - data:", data, "projectId:", projectId, "apiKeyId:", apiKeyId);
    
    // API key validation is already done by middleware
    // Check if API key has write permission (default to true for now)
    const hasWritePermission = true; // TODO: Get from req.apiKey.permissions

    // Verify project exists and is active
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      select: {
        id: true,
        slug: true,
        bucket: true,
        team: {
          select: {
            slug: true,
            organization: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });
    
    console.log("📋 Project found:", project);

    if (!project) {
      throw new Error("project_not_found");
    }

    if (!project.bucket) {
      throw new Error("project_has_no_bucket");
    }

    if (!project.team) {
      throw new Error("project_has_no_team");
    }

    // Check rate limits
    await checkProjectRateLimit(projectId, "uploads");

    // Get storage adapter for the project's bucket
    const adapter = await getAdapterForProject(projectId);

    // Generate file path with proper org/team/project isolation
    const projectContext: ProjectContext = {
      organizationSlug: project.team.organization.slug,
      teamSlug: project.team.slug,
      projectSlug: project.slug,
    };

    const filePath = generateFilePath(projectContext, data.fileName, {
      tenantSlug: data.tenantId || undefined,
    });

    // Generate signed URL
    const signedUrl = await adapter.getSignedPutUrl(filePath, {
      contentType: data.contentType,
      metadata: {
        projectId,
        tenantId: data.tenantId || "",
        uploadedBy: apiKeyId,
        originalPath: data.fileName,
      },
    });

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        projectId,
        path: filePath,
        status: "initiated",
      },
    });

    // Bump usage
    await bumpUsage(projectId, { uploads: 1 });

    return {
      uploadId: upload.id,
      path: filePath,
      uploadUrl: signedUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  async confirmUpload(data: UploadCallbackInput, projectId: string, apiKeyId: string) {
    // API key validation is already done by middleware

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Update upload status using uploadId
    const upload = await prisma.upload.findFirst({
      where: {
        id: data.uploadId,
        projectId,
        status: "initiated",
      },
    });

    if (!upload) {
      throw new Error("upload_not_found");
    }

    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "completed" },
    });

    // Create file record
    const file = await prisma.file.create({
      data: {
        projectId,
        path: upload.path,
        filename: upload.path.split("/").pop() || "",
        size: BigInt(data.metadata?.size || 0),
        mimeType: data.metadata?.contentType || "application/octet-stream",
        version: "v1",
        tenantId: null, // Will be extracted from upload.path if needed
        metadata: {
          etag: data.metadata?.etag,
          uploadedAt: new Date().toISOString(),
          apiKeyId: apiKeyId,
          originalPath: upload.path,
        },
      },
    });

    return { file };
  }

  async proxyUpload(req: any, projectId: string, apiKeyId: string) {
    // Handle file upload through the server to avoid CORS issues
    const uploadId = req.body.uploadId;
    const file = req.files?.file;
    
    if (!uploadId) {
      throw new Error("missing_upload_id");
    }
    
    if (!file) {
      throw new Error("missing_file");
    }
    
    // Find the upload record
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        projectId,
        status: "initiated",
      },
    });

    if (!upload) {
      throw new Error("upload_not_found");
    }

    // Get project with bucket info
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: { bucket: true },
    });

    if (!project || !project.bucket) {
      throw new Error("project_not_found");
    }

    // Create storage adapter
    const adapter = await getAdapterForBucket(project.bucket.id);

    // Upload file to storage
    await adapter.putObject(upload.path, file.data, {
      projectId,
      uploadedBy: apiKeyId,
    }, file.mimetype);

    // Update upload status
    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "completed" },
    });

    // Create file record
    const fileRecord = await prisma.file.create({
      data: {
        projectId,
        path: upload.path,
        filename: upload.path.split("/").pop() || "",
        size: BigInt(file.size),
        mimeType: file.mimetype,
        version: "v1",
        tenantId: null,
        metadata: {
          uploadedAt: new Date().toISOString(),
          apiKeyId: apiKeyId,
          originalPath: upload.path,
        },
      },
    });

    return { 
      success: true, 
      etag: "uploaded",
      file: {
        ...fileRecord,
        size: Number(fileRecord.size), // Convert BigInt to number for JSON serialization
      }
    };
  }

  async listUploads(projectId: string, apiKeyId: string) {
    // API key validation is already done by middleware
    // Check if API key has read permission (default to true for now)
    const hasReadPermission = true; // TODO: Get from req.apiKey.permissions

    const uploads = await prisma.upload.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent uploads
    });

    return uploads;
  }

  async getUploadById(id: string, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.upload.findFirst({
      where: { id, projectId },
    });
  }


}

export const uploadsService = new UploadsService();
