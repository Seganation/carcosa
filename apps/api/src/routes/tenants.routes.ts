import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as Tenants from "../controllers/tenants.controller.js";

const router = Router();

// Protected tenant routes
router.get("/projects/:id/tenants", authMiddleware, Tenants.list);
router.post("/projects/:id/tenants", authMiddleware, Tenants.create);
router.put("/projects/:id/tenants/:tenantId", authMiddleware, Tenants.update);
router.delete("/projects/:id/tenants/:tenantId", authMiddleware, Tenants.del);

export default router;


