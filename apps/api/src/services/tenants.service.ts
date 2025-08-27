import { prisma } from "@carcosa/database";
import type { CreateTenantInput, UpdateTenantInput } from "../validations/tenants.validation.js";

export class TenantsService {
  async listByProject(projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.tenant.findMany({
      where: { projectId },
      orderBy: { slug: "asc" },
    });
  }

  async getById(id: string, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.tenant.findFirst({
      where: { id, projectId },
    });
  }

  async create(data: CreateTenantInput, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Check if slug is already taken in this project
    const existingTenant = await prisma.tenant.findFirst({
      where: { projectId, slug: data.slug },
    });

    if (existingTenant) {
      throw new Error("tenant_slug_already_exists");
    }

    return prisma.tenant.create({
      data: {
        projectId,
        slug: data.slug,
        metadata: data.metadata,
      },
    });
  }

  async update(id: string, data: UpdateTenantInput, projectId: string, ownerId: string) {
    const tenant = await this.getById(id, projectId, ownerId);
    if (!tenant) {
      throw new Error("tenant_not_found");
    }

    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, projectId: string, ownerId: string) {
    const tenant = await this.getById(id, projectId, ownerId);
    if (!tenant) {
      throw new Error("tenant_not_found");
    }

    await prisma.tenant.delete({
      where: { id },
    });

    return { ok: true };
  }
}

export const tenantsService = new TenantsService();
