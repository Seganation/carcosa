import type { Request, Response } from "express";
import { organizationsService } from "../services/organizations.service.js";
import { z } from "zod";
import { TeamRole, OrganizationRole } from "../types/enums.js";

// Use global Request interface

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

export async function createOrganization(req: AuthenticatedRequest, res: Response) {
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

export async function getOrganization(req: AuthenticatedRequest, res: Response) {
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

export async function listUserOrganizations(req: AuthenticatedRequest, res: Response) {
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

export async function createTeam(req: AuthenticatedRequest, res: Response) {
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

export async function getTeam(req: AuthenticatedRequest, res: Response) {
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

export async function listUserTeams(req: AuthenticatedRequest, res: Response) {
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

export async function inviteUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = inviteUserSchema.parse(req.body);
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

export async function acceptInvitation(req: AuthenticatedRequest, res: Response) {
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

export async function listPendingInvitations(req: AuthenticatedRequest, res: Response) {
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
