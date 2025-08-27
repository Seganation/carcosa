import { PrismaClient } from "@carcosa/database";
import { TeamRole } from "../types/enums.js";

const prisma = new PrismaClient();

export class BucketsService {
  // List buckets accessible to a user (either owned by their teams or shared with them)
  async listAccessibleBuckets(userId: string) {
    // Get all teams user belongs to
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true, role: true },
    });

    const teamIds = userTeams.map(member => member.teamId);

    return prisma.bucket.findMany({
      where: {
        OR: [
          // Buckets owned by user's teams
          { ownerTeamId: { in: teamIds } },
          // Buckets shared with user's teams
          { 
            sharedTeams: { 
              some: { 
                teamId: { in: teamIds } 
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
          where: { teamId: { in: teamIds } },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // List buckets for a specific organization
  async listOrganizationBuckets(organizationId: string, userId: string) {
    // Verify user has access to the organization
    const orgAccess = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!orgAccess) {
      throw new Error("organization_access_denied");
    }

    return prisma.bucket.findMany({
      where: {
        ownerTeam: { organizationId },
      },
      include: {
        ownerTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        sharedTeams: {
          include: {
            team: {
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
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get bucket details with access information
  async getBucketById(bucketId: string, userId: string) {
    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true, role: true },
    });

    const teamIds = userTeams.map(member => member.teamId);

    const bucket = await prisma.bucket.findFirst({
      where: {
        id: bucketId,
        OR: [
          // User's teams own the bucket
          { ownerTeamId: { in: teamIds } },
          // Bucket is shared with user's teams
          { 
            sharedTeams: { 
              some: { 
                teamId: { in: teamIds } 
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
        sharedTeams: {
          include: {
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
        },
        projects: {
          select: {
            id: true,
            name: true,
            slug: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bucket) {
      throw new Error("bucket_not_found");
    }

    return bucket;
  }

  // Create a new bucket (organization admin only)
  async createBucket(bucketData: any, ownerTeamId: string, userId: string) {
    // Verify user has admin access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: {
        teamId: ownerTeamId,
        userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!teamAccess) {
      throw new Error("insufficient_permissions");
    }

    // Check if bucket already exists for this team
    const existingBucket = await prisma.bucket.findFirst({
      where: {
        ownerTeamId,
        bucketName: bucketData.bucketName,
        provider: bucketData.provider,
      },
    });

    if (existingBucket) {
      throw new Error("bucket_already_exists");
    }

    return prisma.bucket.create({
      data: {
        ...bucketData,
        ownerTeamId,
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
      },
    });
  }

  // Grant team access to bucket
  async grantTeamAccess(bucketId: string, teamId: string, accessLevel: string, userId: string) {
    // Get bucket and verify user has admin access
    const bucket = await this.getBucketById(bucketId, userId);
    
    // Check if user has admin access to the bucket (owner or admin of owning team)
    const ownerTeamAccess = await prisma.teamMember.findFirst({
      where: {
        teamId: bucket.ownerTeamId,
        userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!ownerTeamAccess) {
      throw new Error("insufficient_permissions");
    }

    // Check if access already exists
    const existingAccess = await prisma.bucketTeamAccess.findUnique({
      where: {
        bucketId_teamId: {
          bucketId,
          teamId,
        },
      },
    });

    if (existingAccess) {
      // Update existing access
      return prisma.bucketTeamAccess.update({
        where: {
          bucketId_teamId: {
            bucketId,
            teamId,
          },
        },
        data: { accessLevel },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Create new access
      return prisma.bucketTeamAccess.create({
        data: {
          bucketId,
          teamId,
          accessLevel,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }
  }

  // Revoke team access to bucket
  async revokeTeamAccess(bucketId: string, teamId: string, userId: string) {
    // Get bucket and verify user has admin access
    const bucket = await this.getBucketById(bucketId, userId);
    
    // Check if user has admin access to the bucket
    const ownerTeamAccess = await prisma.teamMember.findFirst({
      where: {
        teamId: bucket.ownerTeamId,
        userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!ownerTeamAccess) {
      throw new Error("insufficient_permissions");
    }

    // Cannot revoke access from the owner team
    if (teamId === bucket.ownerTeamId) {
      throw new Error("cannot_revoke_owner_access");
    }

    return prisma.bucketTeamAccess.delete({
      where: {
        bucketId_teamId: {
          bucketId,
          teamId,
        },
      },
    });
  }

  // Get teams that can be granted access to a bucket
  async getAvailableTeamsForBucket(bucketId: string, userId: string) {
    // Get bucket and verify access
    const bucket = await this.getBucketById(bucketId, userId);
    
    // Get all teams in the same organization that don't already have access
    const organizationId = bucket.ownerTeam.organization.id;
    const currentAccessTeamIds = bucket.sharedTeams.map(access => access.teamId);
    currentAccessTeamIds.push(bucket.ownerTeamId); // Add owner team

    return prisma.team.findMany({
      where: {
        organizationId,
        id: { notIn: currentAccessTeamIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
  }

  // Generate file path with proper isolation
  generateFilePath(organizationSlug: string, teamSlug: string, projectSlug: string, filename: string): string {
    return `${organizationSlug}/${teamSlug}/${projectSlug}/${filename}`;
  }

  // Get accessible buckets for a specific team (for project creation)
  async getTeamAccessibleBuckets(teamId: string, userId: string) {
    // Verify user has access to the team
    const teamAccess = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!teamAccess) {
      throw new Error("team_access_denied");
    }

    return prisma.bucket.findMany({
      where: {
        OR: [
          // Team owns the bucket
          { ownerTeamId: teamId },
          // Team has access to the bucket
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
          },
        },
        sharedTeams: {
          where: { teamId },
          select: {
            accessLevel: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }
}

export const bucketsService = new BucketsService();
