import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Settings from "../controllers/settings.controller.js";

const router = Router();

// Protected settings routes
router.get("/api/v1/projects/:id/settings", authMiddleware, Settings.getProjectSettings);

// Update project settings
router.post("/api/v1/projects/:id/settings", authMiddleware, Settings.updateProjectSettings);

// Regenerate API key
router.post("/api/v1/projects/:id/regenerate-key", authMiddleware, Settings.regenerateApiKey);

export default router;
