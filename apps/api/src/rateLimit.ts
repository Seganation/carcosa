import type { Request, Response, NextFunction } from "express";
import { rateLimitMiddleware, skipInDevelopment } from "./middlewares/advanced-rate-limit.js";

/**
 * Create rate limit middleware
 *
 * Now uses in-memory rate limiting with VPS RAM (no Redis dependency)
 *
 * @param opts - Options (maintained for backward compatibility)
 * @returns Rate limiting middleware
 */
export function createRateLimit(opts?: { redisUrl?: string; pgUrl?: string }) {
  // Return the advanced rate limit middleware
  // Skip rate limiting in development environment by default
  return rateLimitMiddleware({
    skip: skipInDevelopment,
  });
}
