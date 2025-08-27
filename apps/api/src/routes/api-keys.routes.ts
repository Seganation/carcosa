import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as ApiKeys from "../controllers/api-keys.controller.js";

const router = Router();

// Protected API key routes (dashboard management)
router.get("/projects/:id/api-keys", authMiddleware, ApiKeys.list);
router.post("/projects/:id/api-keys", authMiddleware, ApiKeys.create);
router.put("/projects/:id/api-keys/:keyId", authMiddleware, ApiKeys.update);
router.delete("/projects/:id/api-keys/:keyId", authMiddleware, ApiKeys.revoke);
router.post("/projects/:id/api-keys/:keyId/regenerate", authMiddleware, ApiKeys.regenerate);

export default router;
