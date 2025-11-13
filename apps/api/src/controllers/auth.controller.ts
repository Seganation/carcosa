import { Request, Response } from "express";
import { prisma } from "@carcosa/database";
import { hashPassword, comparePassword, signJwt, verifyJwt } from "../auth.js";
import { env } from "../env.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "user_already_exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return res.status(201).json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "registration_failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Verify password
    const isValid = await comparePassword(body.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Generate JWT
    const token = signJwt({
      userId: user.id,
      email: user.email ?? undefined
    });

    // Set HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token, // Also return token for localStorage option
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "login_failed" });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("auth_token");
  return res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  try {
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({ error: "no_token" });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ error: "invalid_token" });
    }

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

    return res.json({ user });
  } catch (error) {
    return res.status(401).json({ error: "invalid_token" });
  }
}
