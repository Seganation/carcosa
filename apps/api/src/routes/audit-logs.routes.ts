import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as AuditLogs from "../controllers/audit-logs.controller.js";

const router = Router();

// Protected audit log routes - project-specific
router.get("/projects/:id/audit-logs", authMiddleware, AuditLogs.getProjectAuditLogs);

// Get audit logs for a specific user
router.get("/users/:id/audit-logs", authMiddleware, AuditLogs.getUserAuditLogs);

// Get audit logs across all projects (admin only)
router.get("/audit-logs", authMiddleware, AuditLogs.getAllAuditLogs);

// Export audit logs as CSV
router.get("/projects/:id/audit-logs/export", authMiddleware, AuditLogs.exportAuditLogs);

export default router;
