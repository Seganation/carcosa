import { PrismaClient } from "@carcosa/database";
import { TeamRole, OrganizationRole, InvitationStatus } from "../types/enums.js";

const prisma = new PrismaClient();

export interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface CreateTeamData {
  name: string;
  slug: string;
  description?: string;
}

export interface InviteUserData {
  email: string;
  role: TeamRole;
  teamId?: string;
  organizationId?: string;
}

export class OrganizationsService {
  async createOrganization(data: CreateOrganizationData, ownerId: string) {
    return await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          ...data,
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Add owner as organization member with OWNER role
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: ownerId,
          role: OrganizationRole.OWNER,
        },
      });

      // Create default team
      const defaultTeam = await tx.team.create({
        data: {
          name: "Default Team",
          slug: "default",
          description: "Default team for the organization",
          organizationId: organization.id,
        },
      });

      // Add owner as team member with OWNER role
      await tx.teamMember.create({
        data: {
          teamId: defaultTeam.id,
          userId: ownerId,
          role: TeamRole.OWNER,
        },
      });

      return {
        ...organization,
        defaultTeam,
      };
    });
  }

  async getOrganizationById(id: string, userId: string) {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async getUserOrganizations(userId: string) {
    return await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            teams: true,
          },
        },
      },
    });
  }

  async createTeam(data: CreateTeamData, organizationId: string, userId: string) {
    // Check if user has permission to create teams in this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: {
          in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
        },
      },
    });

    if (!membership) {
      throw new Error("Insufficient permissions to create teams");
    }

    return await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          ...data,
          organizationId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Add creator as team member with ADMIN role
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: TeamRole.ADMIN,
        },
      });

      return team;
    });
  }

  async getTeamById(id: string, userId: string) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [
          { organization: { ownerId: userId } },
          { organization: { members: { some: { userId } } } },
          { members: { some: { userId } } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });

    return team;
  }

  async getUserTeams(userId: string) {
    return await prisma.team.findMany({
      where: {
        OR: [
          { organization: { ownerId: userId } },
          { organization: { members: { some: { userId } } } },
          { members: { some: { userId } } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });
  }

  async inviteUser(data: InviteUserData, invitedBy: string) {
    // Check if inviter has permission
    if (data.teamId) {
      const teamMembership = await prisma.teamMember.findFirst({
        where: {
          teamId: data.teamId,
          userId: invitedBy,
          role: {
            in: [TeamRole.OWNER, TeamRole.ADMIN],
          },
        },
      });

      if (!teamMembership) {
        throw new Error("Insufficient permissions to invite users to team");
      }
    } else if (data.organizationId) {
      const orgMembership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: data.organizationId,
          userId: invitedBy,
          role: {
            in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
          },
        },
      });

      if (!orgMembership) {
        throw new Error("Insufficient permissions to invite users to organization");
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: data.email,
        teamId: data.teamId || null,
        organizationId: data.organizationId || null,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new Error("Invitation already exists for this user");
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        ...data,
        invitedBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Invitation is no longer valid");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    return await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Add user to team or organization
      if (invitation.teamId) {
        await tx.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId,
            role: invitation.role,
          },
        });
      } else if (invitation.organizationId) {
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role as OrganizationRole,
          },
        });
      }

      return { success: true };
    });
  }

  async getPendingInvitations(userId: string) {
    // First get the user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      return [];
    }

    return await prisma.invitation.findMany({
      where: {
        email: user.email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const organizationsService = new OrganizationsService();
