/**
 * Rate Limit Configuration
 *
 * Defines rate limits for different operation types and permissions.
 * Uses in-memory storage for VPS deployment.
 */

import type { RateLimitConfig } from "../utils/in-memory-rate-limiter.js";
import { Permission } from "../types/permissions.js";

/**
 * Rate limit tier configurations
 * Development mode: Much higher limits for testing
 */
const isDevelopment = process.env.NODE_ENV !== "production";

export const RateLimitTiers = {
  /**
   * Very high limit for read operations
   * Use for: GET requests, file listings, stats
   */
  READ: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 100000 : 10000,
  },

  /**
   * High limit for standard operations
   * Use for: Standard read/write operations
   */
  STANDARD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 100000 : 1000,
  },

  /**
   * Medium limit for write operations
   * Use for: POST/PUT/PATCH requests
   */
  WRITE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 100000 : 500,
  },

  /**
   * Low limit for expensive operations
   * Use for: File uploads, transforms, heavy processing
   */
  EXPENSIVE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 10000 : 100,
  },

  /**
   * Very low limit for delete operations
   * Use for: DELETE requests, destructive operations
   */
  DELETE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 1000 : 50,
  },

  /**
   * Extremely low limit for admin operations
   * Use for: API key management, settings changes
   */
  ADMIN: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 1000 : 20,
  },
} as const;

/**
 * Permission-based rate limits
 *
 * Maps permissions to their appropriate rate limit tier
 */
export const PermissionRateLimits: Record<string, RateLimitConfig> = {
  // Read permissions - High limits
  [Permission.READ_FILES]: RateLimitTiers.READ,
  [Permission.READ_PROJECTS]: RateLimitTiers.READ,
  [Permission.READ_TRANSFORMS]: RateLimitTiers.READ,
  [Permission.READ_USAGE]: RateLimitTiers.READ,
  [Permission.READ_AUDIT_LOGS]: RateLimitTiers.READ,

  // Write permissions - Medium limits
  [Permission.WRITE_FILES]: RateLimitTiers.WRITE,
  [Permission.WRITE_PROJECTS]: RateLimitTiers.WRITE,

  // Delete permissions - Low limits
  [Permission.DELETE_FILES]: RateLimitTiers.DELETE,
  [Permission.DELETE_TRANSFORMS]: RateLimitTiers.DELETE,

  // Upload permissions - Expensive limits
  [Permission.UPLOAD_FILES]: RateLimitTiers.EXPENSIVE,
  [Permission.UPLOAD_INIT]: RateLimitTiers.EXPENSIVE,
  [Permission.UPLOAD_COMPLETE]: RateLimitTiers.EXPENSIVE,

  // Transform permissions - Expensive limits
  [Permission.TRANSFORM_CREATE]: RateLimitTiers.EXPENSIVE,
  [Permission.TRANSFORM_REQUEST]: RateLimitTiers.EXPENSIVE,

  // Admin permissions - Very restrictive
  [Permission.MANAGE_API_KEYS]: RateLimitTiers.ADMIN,
  [Permission.MANAGE_RATE_LIMITS]: RateLimitTiers.ADMIN,

  // Wildcard - Standard limit
  [Permission.ALL]: RateLimitTiers.STANDARD,
};

/**
 * Endpoint-specific rate limits
 *
 * More specific rate limits for particular endpoints
 * Takes precedence over permission-based limits
 */
export const EndpointRateLimits: Record<string, RateLimitConfig> = {
  // Authentication endpoints - Prevent brute force
  "POST /api/v1/auth/login": {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: isDevelopment ? 1000 : 10,
  },
  "POST /api/v1/auth/register": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: isDevelopment ? 1000 : 20,
  },

  // Transform endpoint - High traffic, needs high limit
  "GET /api/v1/transform/*": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5000,
  },

  // File download - Medium limit
  "GET /api/v1/projects/:id/files/:fileId/download": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  },

  // API key creation - Very restrictive
  "POST /api/v1/projects/:id/api-keys": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
};

/**
 * Default rate limit for unauthenticated requests
 */
export const UnauthenticatedRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

/**
 * Default rate limit for authenticated requests
 */
export const AuthenticatedRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
};

/**
 * Get rate limit config for a specific permission
 */
export function getRateLimitForPermission(permission: string): RateLimitConfig {
  return PermissionRateLimits[permission] || RateLimitTiers.STANDARD;
}

/**
 * Get rate limit config for a specific endpoint
 */
export function getRateLimitForEndpoint(
  method: string,
  path: string
): RateLimitConfig | null {
  const key = `${method} ${path}`;

  // Check exact match
  if (EndpointRateLimits[key]) {
    return EndpointRateLimits[key];
  }

  // Check wildcard patterns
  for (const [pattern, config] of Object.entries(EndpointRateLimits)) {
    if (pattern.includes("*")) {
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/:\w+/g, "[^/]+") + "$"
      );
      if (regex.test(key)) {
        return config;
      }
    }
  }

  return null;
}

/**
 * Get the most restrictive rate limit from multiple configs
 */
export function getMostRestrictiveLimit(
  ...configs: RateLimitConfig[]
): RateLimitConfig {
  if (configs.length === 0) {
    return AuthenticatedRateLimit;
  }

  // Find the config with lowest maxRequests per unit time
  return configs.reduce((most, current) => {
    const mostRate = most.maxRequests / most.windowMs;
    const currentRate = current.maxRequests / current.windowMs;
    return currentRate < mostRate ? current : most;
  });
}

/**
 * Get rate limit config for a request
 *
 * Priority:
 * 1. Endpoint-specific limit
 * 2. Permission-based limit (most restrictive if multiple)
 * 3. Authenticated/unauthenticated default
 */
export function getRateLimitForRequest(
  method: string,
  path: string,
  permissions: string[],
  isAuthenticated: boolean
): RateLimitConfig {
  // Check endpoint-specific limit first
  const endpointLimit = getRateLimitForEndpoint(method, path);
  if (endpointLimit) {
    return endpointLimit;
  }

  // Check permission-based limits
  if (permissions.length > 0) {
    const permissionLimits = permissions
      .map((p) => PermissionRateLimits[p])
      .filter((limit): limit is RateLimitConfig => limit !== undefined);

    if (permissionLimits.length > 0) {
      return getMostRestrictiveLimit(...permissionLimits);
    }
  }

  // Fall back to default limits
  return isAuthenticated ? AuthenticatedRateLimit : UnauthenticatedRateLimit;
}
