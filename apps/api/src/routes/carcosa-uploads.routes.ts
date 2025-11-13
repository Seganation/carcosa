/**
 * 🚀 CARCOSA FILE-ROUTER ROUTES
 *
 * Advanced upload routes using the @carcosa/file-router package
 */

import { Router } from "express";
import { validateApiKey } from "../middlewares/api-key.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";
import { Permission } from "../types/permissions.js";
import {
  handleImageUpload,
  handleDocumentUpload,
  handleVideoUpload,
  initCarcosaUpload,
  completeCarcosaUpload,
  carcosaHealth
} from "../controllers/carcosa-uploads.controller.js";

const router = Router();

// Health check for Carcosa file-router (public)
router.get("/health", carcosaHealth);

// Typed upload routes (require API key and upload permissions)
router.post(
  "/images",
  validateApiKey,
  requirePermission(Permission.UPLOAD_FILES),
  handleImageUpload
);

router.post(
  "/documents",
  validateApiKey,
  requirePermission(Permission.UPLOAD_FILES),
  handleDocumentUpload
);

router.post(
  "/videos",
  validateApiKey,
  requirePermission(Permission.UPLOAD_FILES),
  handleVideoUpload
);

// Upload flow endpoints (require init and complete permissions)
router.post(
  "/init",
  validateApiKey,
  requirePermission(Permission.UPLOAD_INIT),
  initCarcosaUpload
);

router.post(
  "/complete",
  validateApiKey,
  requirePermission(Permission.UPLOAD_COMPLETE),
  completeCarcosaUpload
);

// Upload status endpoint
router.get("/status/:uploadId", async (req, res) => {
  // TODO: Implement upload status checking
  res.json({ 
    uploadId: req.params.uploadId,
    status: "completed",
    message: "Upload status checking via Carcosa file-router",
    service: "carcosa-file-router"
  });
});

export default router;
