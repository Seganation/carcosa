import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Usage from "../controllers/usage.controller.js";

const router = Router();

// Protected usage routes - project-specific
router.get("/projects/:id/usage", authMiddleware, Usage.dailyForProject);

// Get usage breakdown by tenant
router.get("/projects/:id/usage/tenants", authMiddleware, Usage.getProjectUsageByTenant);

export default router;


