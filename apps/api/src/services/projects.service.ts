import { PrismaClient } from "@carcosa/database";
import { TeamRole } from "../types/enums.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validations/projects.validation.js";

const prisma = new PrismaClient();

export class ProjectsService {
  async listByOwner(ownerId: string) {
    return prisma.project.findMany({
      where: { 
        OR: [
          { ownerId },
          { team: { members: { some: { userId: ownerId } } } },
          { team: { organization: { members: { some: { userId: ownerId } } } } },
        ]
      },
      include: {
        bucket: {
          select: {
            id: true,
            name: true,
            provider: true,
            bucketName: true,
            region: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            versions: true,
            tokens: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string, userId: string) {
    return prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { team: { members: { some: { userId } } } },
          { team: { organization: { members: { some: { userId } } } } },
        ],
      },
      include: {
        bucket: true,
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        versions: true,
        tokens: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
    });
  }

  async create(data: CreateProjectInput, ownerId: string, teamId?: string) {
    // Check if slug is already taken by this user or team
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: data.slug,
        OR: [
          { ownerId },
          { teamId: teamId || null },
        ],
      },
    });

    if (existingProject) {
      throw new Error("slug_already_exists");
    }

    // Verify bucket exists and team has access to it
    if (!teamId) {
      throw new Error("team_required_for_bucket_access");
    }

    const bucket = await prisma.bucket.findFirst({
      where: {
        id: data.bucketId,
        OR: [
          // Team owns the bucket
          { ownerTeamId: teamId },
          // Team has shared access to the bucket
          { 
            sharedTeams: { 
              some: { 
                teamId,
                accessLevel: { in: ["READ_WRITE", "ADMIN"] }
              } 
            } 
          },
        ],
      },
      include: {
        ownerTeam: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        sharedTeams: {
          where: { teamId },
          select: {
            accessLevel: true,
          },
        },
      },
    });

    if (!bucket) {
      throw new Error("bucket_not_accessible_to_team");
    }

    // If teamId is provided, verify user has access to the team
    if (teamId) {
      const teamAccess = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: ownerId,
        },
      });

      if (!teamAccess) {
        throw new Error("team_access_denied");
      }
    }

    // Create project with bucket reference, multi-tenant option, and optional team
    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug: data.slug,
        bucketId: data.bucketId,
        ownerId,
        multiTenant: data.multiTenant,
        teamId,
      },
      include: {
        bucket: {
          select: {
            id: true,
            name: true,
            provider: true,
            bucketName: true,
            region: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Create default version
    await prisma.version.create({
      data: {
        projectId: project.id,
        versionName: "v1",
        isActive: true,
      },
    });

    return project;
  }

  async update(id: string, data: UpdateProjectInput, userId: string) {
    const project = await this.getById(id, userId);
    if (!project) {
      throw new Error("project_not_found");
    }

    // Check if user has permission to update (owner or team admin)
    if (project.ownerId !== userId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId!,
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!teamMember) {
        throw new Error("insufficient_permissions");
      }
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        bucket: true,
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const project = await this.getById(id, userId);
    if (!project) {
      throw new Error("project_not_found");
    }

    // Check if user has permission to delete (owner or team admin)
    if (project.ownerId !== userId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId!,
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!teamMember) {
        throw new Error("insufficient_permissions");
      }
    }

    // Delete project and related data (cascading)
    await prisma.project.delete({
      where: { id },
    });

    return { ok: true };
  }

  async getRateLimit(projectId: string, userId: string) {
    const project = await this.getById(projectId, userId);
    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.rateLimitConfig.findUnique({
      where: { projectId },
    });
  }

  async upsertRateLimit(projectId: string, data: any, userId: string) {
    const project = await this.getById(projectId, userId);
    if (!project) {
      throw new Error("project_not_found");
    }

    // Check if user has permission to update rate limits
    if (project.ownerId !== userId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId!,
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!teamMember) {
        throw new Error("insufficient_permissions");
      }
    }

    return prisma.rateLimitConfig.upsert({
      where: { projectId },
      update: data,
      create: {
        projectId,
        ...data,
      },
    });
  }

  async listByTeam(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.project.findMany({
      where: { teamId },
      include: {
        bucket: {
          select: {
            id: true,
            name: true,
            provider: true,
            bucketName: true,
            region: true,
            status: true,
          },
        },
        _count: {
          select: {
            versions: true,
            tokens: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Team-scoped resource methods
  async getTeamTenants(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.tenant.findMany({
      where: {
        project: { teamId },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTeamTransforms(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.transform.findMany({
      where: {
        project: { teamId },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        file: {
          select: {
            id: true,
            filename: true,
            path: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTeamUsage(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.usageDaily.findMany({
      where: {
        project: { teamId },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { day: "desc" },
      take: 30, // Last 30 days
    });
  }

  async getTeamAuditLogs(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.auditLog.findMany({
      where: {
        project: { teamId },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Last 100 entries
    });
  }

  async transferProject(projectId: string, newTeamId: string, userId: string) {
    // Get project and verify access
    const project = await this.getById(projectId, userId);
    if (!project) {
      throw new Error("project_not_found");
    }

    // Check if user has permission to transfer (must be owner or admin of current team)
    if (project.ownerId !== userId) {
      const currentTeamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId!,
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!currentTeamMember) {
        throw new Error("insufficient_permissions");
      }
    }

    // Verify user has access to the new team (must be owner or admin)
    const newTeamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: newTeamId,
        userId,
        role: {
          in: ["OWNER", "ADMIN"],
        },
      },
    });

    if (!newTeamMember) {
      throw new Error("new_team_access_denied");
    }

    // Verify the new team has access to the project's bucket
    const bucket = await prisma.bucket.findFirst({
      where: {
        id: project.bucketId,
        OR: [
          // New team owns the bucket
          { ownerTeamId: newTeamId },
          // New team has access to the bucket
          {
            sharedTeams: {
              some: {
                teamId: newTeamId,
                accessLevel: { in: ["READ_WRITE", "ADMIN"] }
              }
            }
          },
        ],
      },
    });

    if (!bucket) {
      throw new Error("new_team_no_bucket_access");
    }

    // Check if a project with the same slug already exists in the new team
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: project.slug,
        teamId: newTeamId,
      },
    });

    if (existingProject) {
      throw new Error("slug_already_exists_in_new_team");
    }

    // Transfer the project
    return prisma.project.update({
      where: { id: projectId },
      data: {
        teamId: newTeamId,
      },
      include: {
        bucket: {
          select: {
            id: true,
            name: true,
            provider: true,
            bucketName: true,
            region: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }
}

export const projectsService = new ProjectsService();
