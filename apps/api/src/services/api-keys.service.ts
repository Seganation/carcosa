import { prisma } from "@carcosa/database";
import { generateApiKey, hashApiKey } from "../auth.js";
import { createAuditLog } from "../controllers/audit-logs.controller.js";

export interface CreateApiKeyInput {
  label?: string;
  permissions: string[];
  projectId: string;
  ownerId: string;
}

export interface ApiKeyWithProject {
  id: string;
  label?: string;
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

export class ApiKeysService {
  async create(data: CreateApiKeyInput): Promise<{ apiKey: string; apiKeyRecord: any }> {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, ownerId: data.ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Generate new API key
    const { raw: apiKey, hash: keyHash } = generateApiKey();

    // Create API key record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        projectId: data.projectId,
        label: data.label,
        keyHash,
        permissions: data.permissions,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      projectId: data.projectId,
      userId: data.ownerId,
      action: "api_key_created",
      resource: "api_key",
      details: {
        apiKeyId: apiKeyRecord.id,
        label: apiKeyRecord.label,
        permissions: data.permissions,
      },
      ipAddress: "system", // TODO: Get actual IP
      userAgent: "system", // TODO: Get actual user agent
    });

    return {
      apiKey,
      apiKeyRecord,
    };
  }

  async listByProject(projectId: string, ownerId: string): Promise<ApiKeyWithProject[]> {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return apiKeys.map((key: any) => ({
      ...key,
      label: key.label ?? undefined,
      lastUsedAt: key.lastUsedAt ?? undefined,
      revokedAt: key.revokedAt ?? undefined,
      permissions: key.permissions as string[],
    }));
  }

  async revoke(id: string, projectId: string, ownerId: string): Promise<void> {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Find and revoke the API key
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, projectId },
    });

    if (!apiKey) {
      throw new Error("api_key_not_found");
    }

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    // Create audit log
    await createAuditLog({
      projectId,
      userId: ownerId,
      action: "api_key_revoked",
      resource: "api_key",
      details: {
        apiKeyId: id,
        label: apiKey.label,
      },
      ipAddress: "system", // TODO: Get actual IP
      userAgent: "system", // TODO: Get actual user agent
    });
  }

  async regenerate(id: string, projectId: string, ownerId: string): Promise<{ apiKey: string; apiKeyRecord: any }> {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Find the existing API key
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, projectId },
    });

    if (!existingKey) {
      throw new Error("api_key_not_found");
    }

    // Revoke the old key
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    // Generate new API key
    const { raw: apiKey, hash: keyHash } = generateApiKey();

    // Create new API key record
    const newApiKeyRecord = await prisma.apiKey.create({
      data: {
        projectId,
        label: existingKey.label,
        keyHash,
        permissions: existingKey.permissions as string[],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      projectId,
      userId: ownerId,
      action: "api_key_regenerated",
      resource: "api_key",
      details: {
        oldApiKeyId: id,
        newApiKeyId: newApiKeyRecord.id,
        label: existingKey.label,
      },
      ipAddress: "system", // TODO: Get actual IP
      userAgent: "system", // TODO: Get actual user agent
    });

    return {
      apiKey,
      apiKeyRecord: newApiKeyRecord,
    };
  }

  async validateApiKey(apiKey: string, projectId?: string): Promise<any> {
    const keyHash = hashApiKey(apiKey);

    const where: any = {
      keyHash,
      revokedAt: null,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const keyRecord = await prisma.apiKey.findFirst({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            bucketId: true,
            multiTenant: true,
          }
        }
      }
    });

    if (!keyRecord) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      id: keyRecord.id,
      projectId: keyRecord.projectId,
      label: keyRecord.label,
      permissions: keyRecord.permissions as string[],
      project: keyRecord.project,
    };
  }
}

export const apiKeysService = new ApiKeysService();
