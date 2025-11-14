import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createOrganization,
  getOrganization,
  listUserOrganizations,
  initializeWorkspace,
  createTeam,
  getTeam,
  listUserTeams,
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

// Invitation routes (must come before :id route)
router.post("/invite", inviteUser);
router.post("/invitations/:invitationId/accept", acceptInvitation);
router.get("/invitations", listPendingInvitations);

// Organization by ID (must come after more specific routes)
router.get("/:id", getOrganization);

export default router;
