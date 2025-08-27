import { prisma } from "@carcosa/database";
import type { ListFilesInput, DeleteFilesInput } from "../validations/files.validation.js";
import { getAdapterForProject } from "./storage.service.js";

export class FilesService {
  async listFiles(data: ListFilesInput, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    const where: any = { projectId };
    
    if (data.path) {
      where.path = { startsWith: data.path };
    }
    
    if (data.tenantId) {
      where.tenantId = data.tenantId;
    }
    
    if (data.version) {
      where.version = data.version;
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      take: data.limit,
      skip: data.offset,
    });

    const total = await prisma.file.count({ where });

    return {
      files,
      pagination: {
        total,
        limit: data.limit,
        offset: data.offset,
        hasMore: data.offset + data.limit < total,
      },
    };
  }

  async getFileById(id: string, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.file.findFirst({
      where: { id, projectId },
    });
  }

  async deleteFiles(data: DeleteFilesInput, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Get storage adapter
    const adapter = await getAdapterForProject(projectId);

    const deletedFiles = [];
    const errors = [];

    for (const path of data.paths) {
      try {
        // Delete from storage
        await adapter.deleteObject(path);

        // Delete from database
        const where: any = { projectId, path };
        if (data.tenantId) {
          where.tenantId = data.tenantId;
        }

        await prisma.file.deleteMany({ where });

        deletedFiles.push(path);
      } catch (error) {
        errors.push({ path, error: error.message });
      }
    }

    return {
      deletedFiles,
      errors,
      success: errors.length === 0,
    };
  }

  async getSignedUrl(path: string, projectId: string, ownerId: string, operation: "get" | "put" = "get") {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Get storage adapter
    const adapter = await getAdapterForProject(projectId);
    console.log(`🔧 Storage adapter type: ${adapter.constructor.name}`);
    console.log(`🔧 Available methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));
    console.log(`🔧 getSignedGetUrl exists:`, typeof adapter.getSignedGetUrl);

    if (operation === "get") {
      return adapter.getSignedGetUrl(path);
    } else {
      return adapter.getSignedPutUrl(path);
    }
  }

  async updateFileMetadata(id: string, metadata: any, projectId: string, ownerId: string) {
    const file = await this.getFileById(id, projectId, ownerId);
    if (!file) {
      throw new Error("file_not_found");
    }

    return prisma.file.update({
      where: { id },
      data: { metadata },
    });
  }
}

export const filesService = new FilesService();
