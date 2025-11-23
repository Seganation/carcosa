import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Env from "../config/env.js";

export function authMiddleware(
  req: Request,
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
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email?: string };

    // Set both userId (for backward compatibility) and user object (for permissions)
    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res
      .status(401)
      .json({ error: "unauthorized", message: "Invalid token" });
  }
}

export function optionalAuthMiddleware(
  req: Request,
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
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email?: string };
      req.userId = payload.userId;
      req.user = {
        id: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
}
