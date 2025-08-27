import { Request, Response, NextFunction } from "express";
import { prisma } from "@carcosa/database";
import jwt from "jsonwebtoken";
import Env from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  userId: string; // Required when authenticated
}

export async function requireAuth(
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
      return res.status(401).json({ error: "authentication_required" });
    }

    const env = Env.parse(process.env);
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "user_not_found" });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export async function optionalAuth(
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
      return next();
    }

    const env = Env.parse(process.env);
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
}
