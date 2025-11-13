import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";
import { Permission } from "../types/permissions.js";
import {
  handle,
  getProjectTransforms,
  retryTransform,
  deleteTransform,
  getTransformStats,
  getCacheStats
} from "../controllers/transform.controller.js";
import {
  validate,
  transformSchema,
  listTransformsSchema,
  retryTransformSchema,
  deleteTransformSchema,
} from "../utils/validation.js";

const router = Router();

// Image transformation endpoint (public but could be protected per project settings)
router.get("/api/v:version/transform/:projectId/*", validate(transformSchema), handle);

// Project transforms management - project-specific with permission checks
router.get(
  "/projects/:id/transforms",
  authMiddleware,
  requirePermission(Permission.READ_TRANSFORMS),
  validate(listTransformsSchema),
  getProjectTransforms
);

router.get(
  "/projects/:id/transforms/stats",
  authMiddleware,
  requirePermission(Permission.READ_TRANSFORMS),
  getTransformStats
);

router.post(
  "/projects/:id/transforms/:transformId/retry",
  authMiddleware,
  requirePermission(Permission.TRANSFORM_CREATE),
  validate(retryTransformSchema),
  retryTransform
);

router.delete(
  "/projects/:id/transforms/:transformId",
  authMiddleware,
  requirePermission(Permission.DELETE_TRANSFORMS),
  validate(deleteTransformSchema),
  deleteTransform
);

// Cache statistics endpoint (requires admin permission)
router.get(
  "/cache/stats",
  authMiddleware,
  requirePermission(Permission.READ_USAGE),
  getCacheStats
);

export default router;


