import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Env from "../config/env.js";

// Use global Request interface with userId property

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res
        .status(401)
        .json({ error: "unauthorized", message: "No token provided" });
    }

    const env = Env.parse(process.env);
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res
      .status(401)
      .json({ error: "unauthorized", message: "Invalid token" });
  }
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (token) {
      const env = Env.parse(process.env);
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      req.userId = payload.userId;
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
}
