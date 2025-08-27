import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Tokens from "../controllers/tokens.controller.js";

const router = Router();

// Protected token routes
router.get("/api/v1/projects/:id/keys", authMiddleware, Tokens.list);
router.post("/api/v1/projects/:id/keys", authMiddleware, Tokens.create);
router.post("/api/v1/projects/:id/keys/:keyId/revoke", authMiddleware, Tokens.revoke);

export default router;


