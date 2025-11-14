import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createOrganization,
  getOrganization,
  listUserOrganizations,
  initializeWorkspace,
  updateOrganization,
  deleteOrganization,
  listOrganizationMembers,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  createTeam,
  getTeam,
  listUserTeams,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  updateTeamMemberRole,
  removeTeamMember,
  inviteUser,
  acceptInvitation,
  listPendingInvitations,
} from "../controllers/organizations.controller.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Organization routes
router.post("/", createOrganization);
router.get("/", listUserOrganizations);
router.post("/initialize", initializeWorkspace);

// Team routes within organizations (must come before :id route)
router.post("/:organizationId/teams", createTeam);
router.get("/teams", listUserTeams);
router.get("/teams/:id", getTeam);
router.patch("/teams/:id", updateTeam);
router.delete("/teams/:id", deleteTeam);

// Team member routes
router.get("/teams/:id/members", listTeamMembers);
router.patch("/teams/:id/members/:memberId", updateTeamMemberRole);
router.delete("/teams/:id/members/:memberId", removeTeamMember);

// Invitation routes (must come before :id route)
router.post("/invite", inviteUser);
router.post("/invitations/:invitationId/accept", acceptInvitation);
router.get("/invitations", listPendingInvitations);

// Organization by ID routes (must come after more specific routes)
router.get("/:id", getOrganization);
router.patch("/:id", updateOrganization);
router.delete("/:id", deleteOrganization);

// Organization member routes
router.get("/:id/members", listOrganizationMembers);
router.patch("/:id/members/:memberId", updateOrganizationMemberRole);
router.delete("/:id/members/:memberId", removeOrganizationMember);

export default router;
