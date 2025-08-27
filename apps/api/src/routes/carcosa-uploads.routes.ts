/**
 * 🚀 CARCOSA FILE-ROUTER ROUTES
 * 
 * Advanced upload routes using the @carcosa/file-router package
 */

import { Router } from "express";
import { 
  handleImageUpload,
  handleDocumentUpload,
  handleVideoUpload,
  initCarcosaUpload,
  completeCarcosaUpload,
  carcosaHealth
} from "../controllers/carcosa-uploads.controller.js";

const router = Router();

// Health check for Carcosa file-router
router.get("/health", carcosaHealth);

// Typed upload routes
router.post("/images", handleImageUpload);
router.post("/documents", handleDocumentUpload);
router.post("/videos", handleVideoUpload);

// Upload flow endpoints
router.post("/init", initCarcosaUpload);
router.post("/complete", completeCarcosaUpload);

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
