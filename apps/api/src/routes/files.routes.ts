import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";
import { Permission } from "../types/permissions.js";
import * as Files from "../controllers/files.controller.js";

const router = Router();

// Protected file routes with permission checks
router.get(
  "/projects/:id/files",
  authMiddleware,
  requirePermission(Permission.READ_FILES),
  Files.list
);

router.get(
  "/projects/:id/files/:fileId/download",
  authMiddleware,
  requirePermission(Permission.READ_FILES),
  Files.download
);

router.delete(
  "/projects/:id/files",
  authMiddleware,
  requirePermission(Permission.DELETE_FILES),
  Files.del
);

export default router;


