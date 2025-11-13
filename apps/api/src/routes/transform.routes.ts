import { Router } from "express";
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

// Image transformation endpoint
router.get("/api/v:version/transform/:projectId/*", validate(transformSchema), handle);

// Project transforms management - project-specific
router.get("/projects/:id/transforms", validate(listTransformsSchema), getProjectTransforms);
router.get("/projects/:id/transforms/stats", getTransformStats);
router.post("/projects/:id/transforms/:transformId/retry", validate(retryTransformSchema), retryTransform);
router.delete("/projects/:id/transforms/:transformId", validate(deleteTransformSchema), deleteTransform);

// Cache statistics endpoint
router.get("/cache/stats", getCacheStats);

export default router;


