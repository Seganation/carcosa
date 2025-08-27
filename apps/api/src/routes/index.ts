import { Router } from "express";
import auth from "./auth.routes.js";
import buckets from "./buckets.routes.js";
import projects from "./projects.routes.js";
import tenants from "./tenants.routes.js";
import tokens from "./tokens.routes.js";
import uploads from "./uploads.routes.js";
import files from "./files.routes.js";
import usage from "./usage.routes.js";
import transform from "./transform.routes.js";
import rateLimit from "./rate-limit.routes.js";
import auditLogs from "./audit-logs.routes.js";
import settings from "./settings.routes.js";
import apiKeys from "./api-keys.routes.js";
import organizations from "./organizations.routes.js";
import carcosaFileRouter from "./carcosa-file-router.routes.js";

const router = Router();

router.use(auth);
router.use(buckets);
router.use(projects);
router.use(tenants);
router.use(tokens);
router.use(uploads);
router.use(files);
router.use(usage);
router.use(transform);
router.use(rateLimit);
router.use(auditLogs);
router.use(settings);
router.use(apiKeys);
router.use("/organizations", organizations);

// 🚀 CARCOSA FILE-ROUTER: Advanced uploads with typed routes, real-time progress, and multi-storage
router.use("/carcosa", carcosaFileRouter);

export default router;
