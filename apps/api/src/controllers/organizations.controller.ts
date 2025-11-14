import type { Request, Response } from "express";
import { organizationsService } from "../services/organizations.service.js";
import { z } from "zod";
import { TeamRole, OrganizationRole } from "../types/enums.js";

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  logo: z.string().url().optional(),
});

const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
  teamId: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function createOrganization(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = createOrganizationSchema.parse(req.body);
    const organization = await organizationsService.createOrganization(body, req.userId);
    res.status(201).json({ organization });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({ error: "slug_already_exists" });
      }
    }
    console.error("Create organization error:", error);
    res.status(500).json({ error: "organization_creation_failed" });
  }
}

export async function getOrganization(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_organization_id" });
    }

    const organization = await organizationsService.getOrganizationById(id, req.userId);
    if (!organization) {
      return res.status(404).json({ error: "organization_not_found" });
    }

    res.json({ organization });
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({ error: "failed_to_get_organization" });
  }
}

export async function listUserOrganizations(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const organizations = await organizationsService.getUserOrganizations(req.userId);
    res.json({ organizations });
  } catch (error) {
    console.error("List organizations error:", error);
    res.status(500).json({ error: "failed_to_list_organizations" });
  }
}

/**
 * Initialize workspace for legacy users or users without organizations
 * Creates a default organization and team automatically
 */
export async function initializeWorkspace(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    // Check if user already has organizations
    const existingOrgs = await organizationsService.getUserOrganizations(req.userId);
    if (existingOrgs.length > 0) {
      return res.status(400).json({
        error: "workspace_already_exists",
        message: "User already has an organization"
      });
    }

    // Get user info to create personalized workspace
    const { prisma } = await import("@carcosa/database");
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Create workspace with user's name or email
    const userName = user.name || user.email?.split('@')[0] || "User";
    const orgName = `${userName}'s Workspace`;
    const orgSlug = `${userName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-workspace-${Date.now()}`;

    const organization = await organizationsService.createOrganization(
      {
        name: orgName,
        slug: orgSlug,
        description: "Your personal workspace",
      },
      req.userId
    );

    console.log(`✅ Initialized workspace "${orgName}" for legacy user ${user.email}`);

    res.status(201).json({
      organization,
      message: "Workspace initialized successfully"
    });
  } catch (error) {
    console.error("Initialize workspace error:", error);
    res.status(500).json({ error: "workspace_initialization_failed" });
  }
}

export async function createTeam(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = createTeamSchema.parse(req.body);
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ error: "missing_organization_id" });
    }
    
    const team = await organizationsService.createTeam(body, organizationId, req.userId);
    res.status(201).json({ team });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient permissions to create teams") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({ error: "team_slug_already_exists" });
      }
    }
    console.error("Create team error:", error);
    res.status(500).json({ error: "team_creation_failed" });
  }
}

export async function getTeam(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_team_id" });
    }

    const team = await organizationsService.getTeamById(id, req.userId);
    if (!team) {
      return res.status(404).json({ error: "team_not_found" });
    }

    res.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "failed_to_get_team" });
  }
}

export async function listUserTeams(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const teams = await organizationsService.getUserTeams(req.userId);
    res.json({ teams });
  } catch (error) {
    console.error("List teams error:", error);
    res.status(500).json({ error: "failed_to_list_teams" });
  }
}

export async function inviteUser(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = inviteUserSchema.parse(req.body);
    // @ts-ignore - Role type mismatch between schema and service (to be refined)
    const invitation = await organizationsService.inviteUser(body, req.userId);
    res.status(201).json({ invitation });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient permissions to invite users to team") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Insufficient permissions to invite users to organization") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Invitation already exists for this user") {
        return res.status(400).json({ error: "invitation_already_exists" });
      }
    }
    console.error("Invite user error:", error);
    res.status(500).json({ error: "invitation_failed" });
  }
}

export async function acceptInvitation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: "missing_invitation_id" });
    }
    const result = await organizationsService.acceptInvitation(invitationId, req.userId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") {
        return res.status(404).json({ error: "invitation_not_found" });
      }
      if (error.message === "Invitation is no longer valid") {
        return res.status(400).json({ error: "invitation_invalid" });
      }
      if (error.message === "Invitation has expired") {
        return res.status(400).json({ error: "invitation_expired" });
      }
    }
    console.error("Accept invitation error:", error);
    res.status(500).json({ error: "failed_to_accept_invitation" });
  }
}

export async function listPendingInvitations(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const invitations = await organizationsService.getPendingInvitations(req.userId);
    res.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    res.status(500).json({ error: "failed_to_list_invitations" });
  }
}

export async function revokeInvitation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: "missing_invitation_id" });
    }

    await organizationsService.revokeInvitation(invitationId, req.userId);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") {
        return res.status(404).json({ error: "invitation_not_found" });
      }
      if (error.message === "Insufficient permissions to revoke invitation") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
    }
    console.error("Revoke invitation error:", error);
    res.status(500).json({ error: "failed_to_revoke_invitation" });
  }
}

export async function declineInvitation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: "missing_invitation_id" });
    }

    await organizationsService.declineInvitation(invitationId, req.userId);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") {
        return res.status(404).json({ error: "invitation_not_found" });
      }
      if (error.message === "This invitation is not for you") {
        return res.status(403).json({ error: "not_your_invitation" });
      }
      if (error.message === "Invitation is no longer pending") {
        return res.status(400).json({ error: "invitation_not_pending" });
      }
      if (error.message === "Invitation has expired") {
        return res.status(400).json({ error: "invitation_expired" });
      }
    }
    console.error("Decline invitation error:", error);
    res.status(500).json({ error: "failed_to_decline_invitation" });
  }
}

export async function resendInvitation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: "missing_invitation_id" });
    }

    const invitation = await organizationsService.resendInvitation(invitationId, req.userId);
    res.json({ invitation });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") {
        return res.status(404).json({ error: "invitation_not_found" });
      }
      if (error.message === "Insufficient permissions to resend invitation") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
    }
    console.error("Resend invitation error:", error);
    res.status(500).json({ error: "failed_to_resend_invitation" });
  }
}

// ============================================
// ORGANIZATION UPDATE & DELETE
// ============================================

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
});

export async function updateOrganization(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_organization_id" });
    }

    const body = updateOrganizationSchema.parse(req.body);
    const organization = await organizationsService.updateOrganization(id, body, req.userId);
    res.json({ organization });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient permissions to update organization") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({ error: "slug_already_exists" });
      }
    }
    console.error("Update organization error:", error);
    res.status(500).json({ error: "organization_update_failed" });
  }
}

export async function deleteOrganization(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_organization_id" });
    }

    const result = await organizationsService.deleteOrganization(id, req.userId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Organization not found or insufficient permissions") {
        return res.status(404).json({ error: "organization_not_found_or_forbidden" });
      }
      if (error.message.includes("Cannot delete organization with")) {
        return res.status(400).json({ error: "organization_has_active_projects", message: error.message });
      }
    }
    console.error("Delete organization error:", error);
    res.status(500).json({ error: "organization_deletion_failed" });
  }
}

// ============================================
// ORGANIZATION MEMBER MANAGEMENT
// ============================================

export async function listOrganizationMembers(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_organization_id" });
    }

    const members = await organizationsService.listOrganizationMembers(id, req.userId);
    res.json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Access denied to this organization") {
        return res.status(403).json({ error: "access_denied" });
      }
    }
    console.error("List organization members error:", error);
    res.status(500).json({ error: "failed_to_list_members" });
  }
}

const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export async function updateOrganizationMemberRole(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id, memberId } = req.params;
    if (!id || !memberId) {
      return res.status(400).json({ error: "missing_required_parameters" });
    }

    const body = updateMemberRoleSchema.parse(req.body);
    const member = await organizationsService.updateOrganizationMemberRole(
      id,
      memberId,
      body.role as any,
      req.userId
    );
    res.json({ member });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient permissions to update member roles") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Member not found in this organization") {
        return res.status(404).json({ error: "member_not_found" });
      }
      if (error.message === "Cannot change the organization owner's role") {
        return res.status(400).json({ error: "cannot_change_owner_role" });
      }
      if (error.message.includes("Only the current owner can assign the OWNER role")) {
        return res.status(403).json({ error: "only_owner_can_assign_owner_role" });
      }
    }
    console.error("Update organization member role error:", error);
    res.status(500).json({ error: "member_role_update_failed" });
  }
}

export async function removeOrganizationMember(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id, memberId } = req.params;
    if (!id || !memberId) {
      return res.status(400).json({ error: "missing_required_parameters" });
    }

    const result = await organizationsService.removeOrganizationMember(id, memberId, req.userId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient permissions to remove members") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Member not found in this organization") {
        return res.status(404).json({ error: "member_not_found" });
      }
      if (error.message === "Cannot remove the organization owner") {
        return res.status(400).json({ error: "cannot_remove_owner" });
      }
    }
    console.error("Remove organization member error:", error);
    res.status(500).json({ error: "member_removal_failed" });
  }
}

// ============================================
// TEAM UPDATE & DELETE
// ============================================

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
});

export async function updateTeam(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_team_id" });
    }

    const body = updateTeamSchema.parse(req.body);
    const team = await organizationsService.updateTeam(id, body, req.userId);
    res.json({ team });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Team not found") {
        return res.status(404).json({ error: "team_not_found" });
      }
      if (error.message === "Insufficient permissions to update team") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({ error: "slug_already_exists" });
      }
    }
    console.error("Update team error:", error);
    res.status(500).json({ error: "team_update_failed" });
  }
}

export async function deleteTeam(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_team_id" });
    }

    const result = await organizationsService.deleteTeam(id, req.userId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Team not found") {
        return res.status(404).json({ error: "team_not_found" });
      }
      if (error.message.includes("Insufficient permissions to delete team")) {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message.includes("Cannot delete team with")) {
        return res.status(400).json({ error: "team_has_active_resources", message: error.message });
      }
    }
    console.error("Delete team error:", error);
    res.status(500).json({ error: "team_deletion_failed" });
  }
}

// ============================================
// TEAM MEMBER MANAGEMENT
// ============================================

export async function listTeamMembers(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "missing_team_id" });
    }

    const members = await organizationsService.listTeamMembers(id, req.userId);
    res.json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Access denied to this team") {
        return res.status(403).json({ error: "access_denied" });
      }
    }
    console.error("List team members error:", error);
    res.status(500).json({ error: "failed_to_list_members" });
  }
}

export async function updateTeamMemberRole(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id, memberId } = req.params;
    if (!id || !memberId) {
      return res.status(400).json({ error: "missing_required_parameters" });
    }

    const body = updateMemberRoleSchema.parse(req.body);
    const member = await organizationsService.updateTeamMemberRole(
      id,
      memberId,
      body.role as any,
      req.userId
    );
    res.json({ member });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Team not found") {
        return res.status(404).json({ error: "team_not_found" });
      }
      if (error.message === "Insufficient permissions to update member roles") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Member not found in this team") {
        return res.status(404).json({ error: "member_not_found" });
      }
      if (error.message.includes("Only the current team owner can assign the OWNER role")) {
        return res.status(403).json({ error: "only_owner_can_assign_owner_role" });
      }
    }
    console.error("Update team member role error:", error);
    res.status(500).json({ error: "member_role_update_failed" });
  }
}

export async function removeTeamMember(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id, memberId } = req.params;
    if (!id || !memberId) {
      return res.status(400).json({ error: "missing_required_parameters" });
    }

    const result = await organizationsService.removeTeamMember(id, memberId, req.userId);
    res.json({ result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Team not found") {
        return res.status(404).json({ error: "team_not_found" });
      }
      if (error.message === "Insufficient permissions to remove members") {
        return res.status(403).json({ error: "insufficient_permissions" });
      }
      if (error.message === "Member not found in this team") {
        return res.status(404).json({ error: "member_not_found" });
      }
      if (error.message === "Cannot remove the only team owner") {
        return res.status(400).json({ error: "cannot_remove_only_owner" });
      }
    }
    console.error("Remove team member error:", error);
    res.status(500).json({ error: "member_removal_failed" });
  }
}
