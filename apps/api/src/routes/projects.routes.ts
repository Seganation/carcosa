import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Projects from "../controllers/projects.controller.js";

const router = Router();

// Protected project routes
router.get("/projects", authMiddleware, Projects.list);
router.get("/projects/teams/:teamId", authMiddleware, Projects.listByTeam);
router.get("/projects/:id", authMiddleware, Projects.get);
router.post("/projects", authMiddleware, Projects.create);
router.put("/projects/:id", authMiddleware, Projects.update);
router.post(
  "/projects/:id/validate",
  authMiddleware,
  Projects.validateCredentials
);
router.post(
  "/projects/:id/transfer",
  authMiddleware,
  Projects.transferProject
);
router.delete("/projects/:id", authMiddleware, Projects.deleteProject);

// Team-scoped resource routes
router.get("/teams/:teamId/projects", authMiddleware, Projects.listByTeam);
router.get("/teams/:teamId/tenants", authMiddleware, Projects.getTeamTenants);
router.get("/teams/:teamId/transforms", authMiddleware, Projects.getTeamTransforms);
router.get("/teams/:teamId/usage", authMiddleware, Projects.getTeamUsage);
router.get("/teams/:teamId/audit-logs", authMiddleware, Projects.getTeamAuditLogs);

export default router;
