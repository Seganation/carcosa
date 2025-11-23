import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Tokens from "../controllers/tokens.controller.js";

const router = Router();

// Protected token routes
router.get("/api/v1/projects/:id/keys", authMiddleware, Tokens.list);
router.post("/api/v1/projects/:id/keys", authMiddleware, Tokens.create);
router.post(
  "/api/v1/projects/:id/keys/:keyId/revoke",
  authMiddleware,
  Tokens.revoke
);

// Secure JWT token generation (NEW!)
router.post(
  "/api/v1/projects/:projectId/api-keys/:keyId/token",
  authMiddleware,
  Tokens.generateSecureToken
);
router.post("/api/v1/tokens/verify", Tokens.verifySecureToken); // Public endpoint for SDK

export default router;
