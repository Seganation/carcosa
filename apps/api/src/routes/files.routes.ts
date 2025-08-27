import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Files from "../controllers/files.controller.js";

const router = Router();

// Protected file routes
router.get("/projects/:id/files", authMiddleware, Files.list);
router.get("/projects/:id/files/:fileId/download", authMiddleware, Files.download);
router.delete("/projects/:id/files", authMiddleware, Files.del);

export default router;


