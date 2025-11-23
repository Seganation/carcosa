import { Request, Response } from "express";
import { prisma } from "@carcosa/database";
import { hashPassword, comparePassword, signJwt, verifyJwt } from "../auth.js";
import { env } from "../env.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.validation.js";
import { OrganizationsService } from "../services/organizations.service.js";
import crypto from "crypto";

const organizationsService = new OrganizationsService();

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

    // Auto-create default organization and team for the new user
    try {
      const userName = body.name || body.email.split("@")[0] || "user";
      const orgName = `${userName}'s Workspace`;
      const orgSlug = `${userName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-workspace`;

      await organizationsService.createOrganization(
        {
          name: orgName,
          slug: orgSlug,
          description: "Your personal workspace",
        },
        user.id
      );

      console.log(
        `✅ Auto-created organization "${orgName}" for user ${user.email}`
      );
    } catch (orgError) {
      console.error("Failed to create default organization:", orgError);
      // Don't fail registration if org creation fails
    }

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
      email: user.email ?? undefined,
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

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = updateProfileSchema.parse(req.body);

    // Check if email is being changed and is already taken
    if (body.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.email,
          NOT: { id: req.userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: "email_already_taken" });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: body.name,
        email: body.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return res.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "profile_update_failed" });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = changePasswordSchema.parse(req.body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "user_not_found" });
    }

    // Verify current password
    const isValid = await comparePassword(
      body.currentPassword,
      user.passwordHash
    );
    if (!isValid) {
      return res.status(401).json({ error: "invalid_current_password" });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(body.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newPasswordHash },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "password_change_failed" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.json({
        ok: true,
        message: "If the email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // TODO: Store reset token in database (add passwordResetToken and passwordResetExpires fields to User model)
    // For now, we'll skip token storage and just log it
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordResetToken: resetTokenHash,
    //     passwordResetExpires: expiresAt,
    //   },
    // });

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(
      `Reset link: http://localhost:3000/auth/reset-password?token=${resetToken}`
    );

    return res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent.",
      // In development, return the token for testing
      ...(process.env.NODE_ENV !== "production" && { token: resetToken }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "forgot_password_failed" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body);

    // Hash the provided token
    // TODO: Implement proper token validation once passwordResetToken is added to schema
    // For now, return error as password reset is not fully implemented
    return res.status(501).json({
      error: "not_implemented",
      message:
        "Password reset requires database schema update. Add passwordResetToken fields to User model.",
    });

    // const resetTokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
    // const user = await prisma.user.findFirst({
    //   where: {
    //     passwordResetToken: resetTokenHash,
    //     passwordResetExpires: { gt: new Date() },
    //   },
    // });
    // if (!user) {
    //   return res.status(400).json({ error: "invalid_or_expired_token" });
    // }

    // Hash new password
    // const newPasswordHash = await hashPassword(body.newPassword);
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordHash: newPasswordHash,
    //     passwordResetToken: null,
    //     passwordResetExpires: null,
    //   },
    // });
    // return res.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "validation_failed", details: error.message });
    }
    return res.status(500).json({ error: "password_reset_failed" });
  }
}
