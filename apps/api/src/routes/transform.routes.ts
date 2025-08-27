import { Router } from "express";
import { 
  handle, 
  getProjectTransforms, 
  retryTransform, 
  deleteTransform, 
  getTransformStats 
} from "../controllers/transform.controller.js";

const router = Router();

// Image transformation endpoint
router.get("/api/v:version/transform/:projectId/*", handle);

// Project transforms management - project-specific
router.get("/projects/:id/transforms", getProjectTransforms);
router.get("/projects/:id/transforms/stats", getTransformStats);
router.post("/projects/:id/transforms/:transformId/retry", retryTransform);
router.delete("/projects/:id/transforms/:transformId", deleteTransform);

export default router;


