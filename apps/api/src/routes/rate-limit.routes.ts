import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";
import { Permission } from "../types/permissions.js";
import * as RL from "../controllers/rate-limit.controller.js";

const router = Router();

// Project-specific rate limit configuration (protected)
router.get("/api/v1/projects/:id/rate_limit", authMiddleware, RL.getConfig);
router.post("/api/v1/projects/:id/rate_limit", authMiddleware, RL.upsert);

// Rate limit monitoring endpoints (admin only)
router.get(
  "/api/v1/rate-limits/stats",
  authMiddleware,
  requirePermission(Permission.MANAGE_RATE_LIMITS),
  RL.getStats
);

router.post(
  "/api/v1/rate-limits/reset",
  authMiddleware,
  requirePermission(Permission.MANAGE_RATE_LIMITS),
  RL.resetLimit
);

router.post(
  "/api/v1/rate-limits/reset-all",
  authMiddleware,
  requirePermission(Permission.MANAGE_RATE_LIMITS),
  RL.resetAllLimits
);

export default router;


