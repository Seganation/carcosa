import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";
import { Permission } from "../types/permissions.js";
import * as ApiKeys from "../controllers/api-keys.controller.js";

const router = Router();

// Protected API key routes (dashboard management)
// Note: These require JWT auth (not API key auth) and MANAGE_API_KEYS permission
router.get(
  "/projects/:id/api-keys",
  authMiddleware,
  requirePermission(Permission.MANAGE_API_KEYS),
  ApiKeys.list
);

router.post(
  "/projects/:id/api-keys",
  authMiddleware,
  requirePermission(Permission.MANAGE_API_KEYS),
  ApiKeys.create
);

router.put(
  "/projects/:id/api-keys/:keyId",
  authMiddleware,
  requirePermission(Permission.MANAGE_API_KEYS),
  ApiKeys.update
);

router.delete(
  "/projects/:id/api-keys/:keyId",
  authMiddleware,
  requirePermission(Permission.MANAGE_API_KEYS),
  ApiKeys.revoke
);

router.post(
  "/projects/:id/api-keys/:keyId/regenerate",
  authMiddleware,
  requirePermission(Permission.MANAGE_API_KEYS),
  ApiKeys.regenerate
);

export default router;
