import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

// JWT utilities
export interface JwtPayload {
  userId: string;
  email?: string;
}

export function signJwt(payload: JwtPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Password hashing utilities
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// API Key utilities
export function generateApiKey(): { raw: string; hash: string } {
  const rawBytes = crypto.randomBytes(32).toString("base64url");
  const raw = `carc_${rawBytes}`;
  const hash = hashApiKey(raw);
  return { raw, hash };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function projectTokenFromAuthHeader(authHeader?: string | string[]): string | null {
  if (!authHeader) return null;
  const v = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!v?.startsWith("Bearer ")) return null;
  return v.slice("Bearer ".length);
}

