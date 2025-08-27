import { Router } from "express";
import * as Uploads from "../controllers/uploads.controller.js";
import { validateApiKey } from "../middlewares/api-key.middleware.js";

const router = Router();

// Public upload routes (protected by API key validation)
router.post("/projects/:id/uploads/init", validateApiKey, Uploads.initUpload);
router.post("/projects/:id/uploads/upload", validateApiKey, Uploads.proxyUpload);
router.post("/projects/:id/uploads/confirm", validateApiKey, Uploads.confirmUpload);
router.get("/projects/:id/uploads", validateApiKey, Uploads.listUploads);

export default router;


