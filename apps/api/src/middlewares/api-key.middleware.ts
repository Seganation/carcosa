import { Request, Response, NextFunction } from "express";
import { prisma } from "@carcosa/database";
import { hashApiKey } from "../auth.js";

export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    
    console.log("🔑 API Key validation - headers:", {
      "x-api-key": req.headers["x-api-key"],
      "authorization": req.headers["authorization"],
      "extracted-key": apiKey
    });

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({
        error: "unauthorized",
        message: "API key required",
        code: "MISSING_API_KEY"
      });
    }

    // Hash the API key for database lookup
    const keyHash = hashApiKey(apiKey);

    // Find the API key and validate it
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            bucketId: true,
            multiTenant: true,
          }
        }
      }
    });

    if (!keyRecord) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid API key",
        code: "INVALID_API_KEY"
      });
    }

    // Check if project is active
    if (!keyRecord.project) {
      return res.status(400).json({
        error: "bad_request",
        message: "Project not found",
        code: "PROJECT_NOT_FOUND"
      });
    }

    // Set API key context on request
    // @ts-ignore - Global types not fully recognized yet
    req.apiKey = {
      id: keyRecord.id,
      projectId: keyRecord.projectId,
      permissions: ["read", "write"], // Default permissions for now
    };

    // Set project context
    req.projectId = keyRecord.projectId;

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    next();
  } catch (error) {
    console.error("API key validation error:", error);
    return res.status(500).json({
      error: "internal_error",
      message: "Failed to validate API key"
    });
  }
}

export async function validateApiKeyWithPermissions(
  requiredPermissions: string[]
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First validate the API key
      await validateApiKey(req, res, (err) => {
        if (err) return next(err);
      });

      // Check if we have the required permissions
      if (!req.apiKey) {
        return res.status(401).json({
          error: "unauthorized",
          message: "API key validation failed",
          code: "VALIDATION_FAILED"
        });
      }

      const hasPermission = requiredPermissions.every(permission =>
        req.apiKey!.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "forbidden",
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required: requiredPermissions,
          current: req.apiKey.permissions
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
