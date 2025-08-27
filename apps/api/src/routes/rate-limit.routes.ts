import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as RL from "../controllers/rate-limit.controller.js";

const router = Router();

// Protected rate limit routes
router.get("/api/v1/projects/:id/rate_limit", authMiddleware, RL.getConfig);
router.post("/api/v1/projects/:id/rate_limit", authMiddleware, RL.upsert);

export default router;


