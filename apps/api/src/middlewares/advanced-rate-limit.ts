/**
 * Advanced Rate Limiting Middleware
 *
 * Features:
 * - In-memory rate limiting (VPS RAM)
 * - Permission-based and endpoint-specific limits
 * - Standard rate limit headers (X-RateLimit-*)
 * - Sliding window algorithm
 * - Per-user and per-IP limiting
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/global.js';
import { globalRateLimiter } from '../utils/in-memory-rate-limiter.js';
import { getRateLimitForRequest } from '../config/rate-limits.js';
import { RateLimitError } from '../utils/errors.js';

/**
 * Get rate limit key for a request
 *
 * Priority:
 * 1. User ID (for authenticated users)
 * 2. API key ID (for API key requests)
 * 3. IP address (for unauthenticated requests)
 */
function getRateLimitKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  // Authenticated user
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }

  // API key
  if (authReq.apiKey?.id) {
    return `apikey:${authReq.apiKey.id}`;
  }

  // IP address fallback
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Get permissions for rate limiting
 */
function getPermissionsForRateLimit(req: Request): string[] {
  const authReq = req as AuthenticatedRequest;

  // JWT users have all permissions
  if (authReq.user) {
    return ['*'];
  }

  // API keys have specific permissions
  if (authReq.apiKey) {
    return authReq.apiKey.permissions || [];
  }

  return [];
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetTime: number,
  retryAfter?: number
): void {
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
  res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());

  if (retryAfter !== undefined) {
    res.setHeader('Retry-After', retryAfter.toString());
  }
}

/**
 * Rate limiting middleware
 *
 * @param options - Optional configuration
 */
export function rateLimitMiddleware(options: {
  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (req: Request) => boolean;

  /**
   * Custom key generator
   */
  keyGenerator?: (req: Request) => string;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if we should skip rate limiting
      if (options.skip && options.skip(req)) {
        return next();
      }

      // Get rate limit key
      const key = options.keyGenerator
        ? options.keyGenerator(req)
        : getRateLimitKey(req);

      // Get permissions
      const permissions = getPermissionsForRateLimit(req);

      // Check if authenticated
      const isAuthenticated = !!(req as AuthenticatedRequest).user || !!(req as AuthenticatedRequest).apiKey;

      // Get rate limit config for this request
      const config = getRateLimitForRequest(
        req.method,
        req.path,
        permissions,
        isAuthenticated
      );

      // Check rate limit
      const result = globalRateLimiter.check(key, config);

      // Add rate limit headers
      addRateLimitHeaders(
        res,
        result.limit,
        result.remaining,
        result.resetTime,
        result.retryAfter
      );

      // If rate limited, throw error
      if (!result.allowed) {
        throw new RateLimitError(
          'Too many requests. Please try again later.',
          result.retryAfter
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create a rate limit middleware for specific endpoints
 *
 * @example
 * router.post('/login', createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), login);
 */
export function createRateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  skip?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if we should skip rate limiting
      if (options.skip && options.skip(req)) {
        return next();
      }

      // Get rate limit key
      const baseKey = options.keyGenerator
        ? options.keyGenerator(req)
        : getRateLimitKey(req);

      const key = options.keyPrefix ? `${options.keyPrefix}:${baseKey}` : baseKey;

      // Check rate limit
      const result = globalRateLimiter.check(key, {
        windowMs: options.windowMs,
        maxRequests: options.maxRequests,
      });

      // Add rate limit headers
      addRateLimitHeaders(
        res,
        result.limit,
        result.remaining,
        result.resetTime,
        result.retryAfter
      );

      // If rate limited, throw error
      if (!result.allowed) {
        throw new RateLimitError(
          'Too many requests. Please try again later.',
          result.retryAfter
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Skip rate limiting for development environment
 */
export function skipInDevelopment(req: Request): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Skip rate limiting for admin users
 */
export function skipForAdmins(req: Request): boolean {
  const authReq = req as AuthenticatedRequest;

  // Check if user has wildcard permission (admin)
  if (authReq.apiKey?.permissions.includes('*')) {
    return true;
  }

  // Check if JWT user (full access)
  if (authReq.user) {
    return false; // Don't skip for JWT users by default
  }

  return false;
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  return globalRateLimiter.getMemoryStats();
}

/**
 * Reset rate limit for a specific key (for testing or admin overrides)
 */
export function resetRateLimit(key: string): void {
  globalRateLimiter.reset(key);
}

/**
 * Reset all rate limits (for testing)
 */
export function resetAllRateLimits(): void {
  globalRateLimiter.resetAll();
}
