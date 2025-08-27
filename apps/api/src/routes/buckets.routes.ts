import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as bucketsController from "../controllers/buckets.controller.js";

const router = Router();

// Protected bucket routes
router.get("/buckets", authMiddleware, bucketsController.list);
router.get("/buckets/:id", authMiddleware, bucketsController.get);
router.post("/buckets", authMiddleware, bucketsController.create);
router.post(
  "/buckets/:id/validate",
  authMiddleware,
  bucketsController.validateCredentials
);
router.delete("/buckets/:id", authMiddleware, bucketsController.deleteBucket);

// Bucket sharing routes
router.post("/buckets/:bucketId/access", authMiddleware, bucketsController.grantTeamAccess);
router.delete("/buckets/:bucketId/access/:teamId", authMiddleware, bucketsController.revokeTeamAccess);
router.get("/buckets/:bucketId/available-teams", authMiddleware, bucketsController.getAvailableTeams);

// Team bucket access routes
router.get("/teams/:teamId/buckets", authMiddleware, bucketsController.getTeamBuckets);

export default router;
