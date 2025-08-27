import crypto from "node:crypto";

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

