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

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
}

export interface UpdateTeamData {
  name?: string;
  slug?: string;
  description?: string;
}

export class OrganizationsService {
  async createOrganization(data: CreateOrganizationData, ownerId: string) {
    return await prisma.$transaction(async (tx: any) => {
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

    return await prisma.$transaction(async (tx: any) => {
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

    return await prisma.$transaction(async (tx: any) => {
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

  async revokeInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          select: {
            organizationId: true,
          },
        },
        organization: true,
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if user has permission to revoke (must be the inviter or org/team admin)
    const isInviter = invitation.invitedBy === userId;

    let hasPermission = isInviter;

    // Check if user is org admin/owner
    if (invitation.organizationId) {
      const orgMembership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId,
          role: {
            in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
          },
        },
      });
      if (orgMembership) hasPermission = true;
    }

    // Check if user is team admin/owner
    if (invitation.teamId) {
      const teamMembership = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          userId,
          role: {
            in: [TeamRole.OWNER, TeamRole.ADMIN],
          },
        },
      });
      if (teamMembership) hasPermission = true;
    }

    if (!hasPermission) {
      throw new Error("Insufficient permissions to revoke invitation");
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { ok: true };
  }

  async declineInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      throw new Error("User not found");
    }

    // Verify invitation is for this user
    if (invitation.email !== user.email) {
      throw new Error("This invitation is not for you");
    }

    // Check if invitation is still valid
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Invitation is no longer pending");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Update invitation status to DECLINED
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.DECLINED },
    });

    return { ok: true };
  }

  async resendInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          select: {
            organizationId: true,
          },
        },
        organization: true,
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if user has permission to resend (must be the inviter or org/team admin)
    const isInviter = invitation.invitedBy === userId;

    let hasPermission = isInviter;

    // Check if user is org admin/owner
    if (invitation.organizationId) {
      const orgMembership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId,
          role: {
            in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
          },
        },
      });
      if (orgMembership) hasPermission = true;
    }

    // Check if user is team admin/owner
    if (invitation.teamId) {
      const teamMembership = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          userId,
          role: {
            in: [TeamRole.OWNER, TeamRole.ADMIN],
          },
        },
      });
      if (teamMembership) hasPermission = true;
    }

    if (!hasPermission) {
      throw new Error("Insufficient permissions to resend invitation");
    }

    // Update invitation with new expiry date
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.PENDING,
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
        invitedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email with invitation link
    console.log(`Resent invitation to ${invitation.email}`);

    return updatedInvitation;
  }

  // ============================================
  // ORGANIZATION UPDATE & DELETE
  // ============================================

  async updateOrganization(id: string, data: UpdateOrganizationData, userId: string) {
    // Check if user has permission (OWNER or ADMIN)
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: id,
        userId,
        role: {
          in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
        },
      },
    });

    if (!membership) {
      throw new Error("Insufficient permissions to update organization");
    }

    return await prisma.organization.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

  async deleteOrganization(id: string, userId: string) {
    // Check if user is the owner (only owner can delete)
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        teams: {
          include: {
            projects: true,
          },
        },
        members: true,
      },
    });

    if (!organization) {
      throw new Error("Organization not found or insufficient permissions");
    }

    // Check if there are active projects
    const projectCount = organization.teams.reduce((sum, team) => sum + team.projects.length, 0);
    if (projectCount > 0) {
      throw new Error(`Cannot delete organization with ${projectCount} active projects. Delete projects first.`);
    }

    // Delete organization (will cascade delete teams, members, invitations)
    await prisma.organization.delete({
      where: { id },
    });

    return { success: true, message: "Organization deleted successfully" };
  }

  // ============================================
  // ORGANIZATION MEMBER MANAGEMENT
  // ============================================

  async listOrganizationMembers(organizationId: string, userId: string) {
    // Check if user has access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Access denied to this organization");
    }

    return await prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { createdAt: 'asc' },
      ],
    });
  }

  async updateOrganizationMemberRole(
    organizationId: string,
    memberId: string,
    newRole: OrganizationRole,
    updatedBy: string
  ) {
    // Check if updater has permission (OWNER or ADMIN)
    const updaterMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: updatedBy,
        role: {
          in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
        },
      },
    });

    if (!updaterMembership) {
      throw new Error("Insufficient permissions to update member roles");
    }

    // Get the member to update
    const memberToUpdate = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        organization: true,
      },
    });

    if (!memberToUpdate || memberToUpdate.organizationId !== organizationId) {
      throw new Error("Member not found in this organization");
    }

    // Prevent changing the owner's role
    if (memberToUpdate.organization.ownerId === memberToUpdate.userId) {
      throw new Error("Cannot change the organization owner's role");
    }

    // Only owner can promote to OWNER role
    if (newRole === OrganizationRole.OWNER && updaterMembership.role !== OrganizationRole.OWNER) {
      throw new Error("Only the current owner can assign the OWNER role");
    }

    return await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeOrganizationMember(organizationId: string, memberId: string, removedBy: string) {
    // Check if remover has permission (OWNER or ADMIN)
    const removerMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: removedBy,
        role: {
          in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
        },
      },
    });

    if (!removerMembership) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Get the member to remove
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        organization: true,
      },
    });

    if (!memberToRemove || memberToRemove.organizationId !== organizationId) {
      throw new Error("Member not found in this organization");
    }

    // Prevent removing the owner
    if (memberToRemove.organization.ownerId === memberToRemove.userId) {
      throw new Error("Cannot remove the organization owner");
    }

    // Remove member from organization
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: "Member removed from organization" };
  }

  // ============================================
  // TEAM UPDATE & DELETE
  // ============================================

  async updateTeam(id: string, data: UpdateTeamData, userId: string) {
    // Check if user has permission (team OWNER/ADMIN or org OWNER/ADMIN)
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
        },
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    const isTeamAdmin = team.members.some(
      (m) => m.role === TeamRole.OWNER || m.role === TeamRole.ADMIN
    );
    const isOrgAdmin = team.organization.members.some(
      (m) => m.role === OrganizationRole.OWNER || m.role === OrganizationRole.ADMIN
    );

    if (!isTeamAdmin && !isOrgAdmin) {
      throw new Error("Insufficient permissions to update team");
    }

    return await prisma.team.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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

  async deleteTeam(id: string, userId: string) {
    // Get team with all related data
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
        },
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        projects: true,
        ownedBuckets: true,
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Only team OWNER or org OWNER can delete
    const isTeamOwner = team.members.some((m) => m.role === TeamRole.OWNER);
    const isOrgOwner = team.organization.members.some((m) => m.role === OrganizationRole.OWNER);

    if (!isTeamOwner && !isOrgOwner) {
      throw new Error("Insufficient permissions to delete team. Only team owner or organization owner can delete.");
    }

    // Check if team has active projects
    if (team.projects.length > 0) {
      throw new Error(`Cannot delete team with ${team.projects.length} active projects. Delete projects first.`);
    }

    // Check if team owns buckets that are in use
    const bucketsInUse = await prisma.bucket.findMany({
      where: {
        teamId: id,
        projects: {
          some: {},
        },
      },
    });

    if (bucketsInUse.length > 0) {
      throw new Error(`Cannot delete team. ${bucketsInUse.length} buckets owned by this team are in use by projects.`);
    }

    // Delete team (will cascade delete members)
    await prisma.team.delete({
      where: { id },
    });

    return { success: true, message: "Team deleted successfully" };
  }

  // ============================================
  // TEAM MEMBER MANAGEMENT
  // ============================================

  async listTeamMembers(teamId: string, userId: string) {
    // Check if user has access to this team
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { members: { some: { userId } } },
          { organization: { members: { some: { userId } } } },
        ],
      },
    });

    if (!team) {
      throw new Error("Access denied to this team");
    }

    return await prisma.teamMember.findMany({
      where: {
        teamId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { createdAt: 'asc' },
      ],
    });
  }

  async updateTeamMemberRole(
    teamId: string,
    memberId: string,
    newRole: TeamRole,
    updatedBy: string
  ) {
    // Check if updater has permission (team OWNER/ADMIN or org OWNER/ADMIN)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: updatedBy },
        },
        organization: {
          include: {
            members: {
              where: { userId: updatedBy },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    const isTeamAdmin = team.members.some(
      (m) => m.role === TeamRole.OWNER || m.role === TeamRole.ADMIN
    );
    const isOrgAdmin = team.organization.members.some(
      (m) => m.role === OrganizationRole.OWNER || m.role === OrganizationRole.ADMIN
    );

    if (!isTeamAdmin && !isOrgAdmin) {
      throw new Error("Insufficient permissions to update member roles");
    }

    // Get the member to update
    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.teamId !== teamId) {
      throw new Error("Member not found in this team");
    }

    // Only team owner can promote to OWNER role
    if (newRole === TeamRole.OWNER) {
      const isTeamOwner = team.members.some((m) => m.role === TeamRole.OWNER);
      if (!isTeamOwner) {
        throw new Error("Only the current team owner can assign the OWNER role");
      }
    }

    return await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeTeamMember(teamId: string, memberId: string, removedBy: string) {
    // Check if remover has permission (team OWNER/ADMIN or org OWNER/ADMIN)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: removedBy },
        },
        organization: {
          include: {
            members: {
              where: { userId: removedBy },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    const isTeamAdmin = team.members.some(
      (m) => m.role === TeamRole.OWNER || m.role === TeamRole.ADMIN
    );
    const isOrgAdmin = team.organization.members.some(
      (m) => m.role === OrganizationRole.OWNER || m.role === OrganizationRole.ADMIN
    );

    if (!isTeamAdmin && !isOrgAdmin) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Get the member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      throw new Error("Member not found in this team");
    }

    // Prevent removing the only owner
    if (memberToRemove.role === TeamRole.OWNER) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: TeamRole.OWNER,
        },
      });

      if (ownerCount === 1) {
        throw new Error("Cannot remove the only team owner");
      }
    }

    // Remove member from team
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: "Member removed from team" };
  }
}

export const organizationsService = new OrganizationsService();
