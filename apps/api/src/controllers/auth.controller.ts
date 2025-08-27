import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "@carcosa/database";
import jwt from "jsonwebtoken";
import Env from "../config/env.js";
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
    const passwordHash = await bcrypt.hash(body.password, 12);

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
    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Generate JWT
    const env = Env.parse(process.env);
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

    const env = Env.parse(process.env);
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

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
