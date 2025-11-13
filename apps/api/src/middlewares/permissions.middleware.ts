import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/global.js';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../types/permissions.js';
import { AuthenticationError, AuthorizationError, ErrorCode } from '../utils/errors.js';

/**
 * Permission Checking Middleware
 *
 * Verifies that the authenticated user/API key has the required permissions
 * to perform an operation.
 */

/**
 * Middleware to require specific permission(s)
 *
 * @param requiredPermissions - Single permission or array of permissions (ANY match)
 *
 * @example
 * // Require specific permission
 * router.get('/files', requirePermission(Permission.READ_FILES), listFiles);
 *
 * // Require any of multiple permissions
 * router.get('/stats', requirePermission([Permission.READ_USAGE, Permission.ALL]), getStats);
 */
export function requirePermission(
  requiredPermissions: Permission | Permission[] | string | string[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    // Check if request is authenticated
    if (!authReq.user && !authReq.apiKey) {
      throw new AuthenticationError('Authentication required', ErrorCode.UNAUTHORIZED);
    }

    // Get user's permissions
    const userPermissions = getUserPermissions(authReq);

    // Normalize required permissions to array
    const required = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    // Check if user has any of the required permissions
    if (!hasAnyPermission(userPermissions, required)) {
      throw new AuthorizationError(
        `Missing required permission(s): ${required.join(', ')}`,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    next();
  };
}

/**
 * Middleware to require ALL specified permissions
 *
 * @param requiredPermissions - Array of permissions (ALL must match)
 *
 * @example
 * router.delete('/project/:id', requireAllPermissions([
 *   Permission.DELETE_FILES,
 *   Permission.WRITE_PROJECTS
 * ]), deleteProject);
 */
export function requireAllPermissions(
  requiredPermissions: Permission[] | string[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    // Check if request is authenticated
    if (!authReq.user && !authReq.apiKey) {
      throw new AuthenticationError('Authentication required', ErrorCode.UNAUTHORIZED);
    }

    // Get user's permissions
    const userPermissions = getUserPermissions(authReq);

    // Check if user has all required permissions
    if (!hasAllPermissions(userPermissions, requiredPermissions)) {
      const missing = requiredPermissions.filter(
        perm => !hasPermission(userPermissions, perm)
      );
      throw new AuthorizationError(
        `Missing required permissions: ${missing.join(', ')}`,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    next();
  };
}

/**
 * Middleware to require admin permission
 *
 * @example
 * router.post('/api-keys', requireAdmin, createApiKey);
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requirePermission(Permission.ALL)(req, res, next);
}

/**
 * Get permissions for the authenticated request
 *
 * - For JWT users: Returns all permissions (users have full access)
 * - For API keys: Returns permissions from the API key
 */
function getUserPermissions(req: AuthenticatedRequest): string[] {
  // JWT users have full access
  if (req.user) {
    return [Permission.ALL];
  }

  // API keys have specific permissions
  if (req.apiKey) {
    const permissions = req.apiKey.permissions;

    // Handle JSON array stored as string
    if (typeof permissions === 'string') {
      try {
        return JSON.parse(permissions);
      } catch {
        return [];
      }
    }

    // Handle already parsed array
    if (Array.isArray(permissions)) {
      return permissions;
    }

    // Fallback
    return [];
  }

  return [];
}

/**
 * Check if request has specific permission (utility function)
 *
 * @example
 * if (checkPermission(req, Permission.DELETE_FILES)) {
 *   // Allow delete
 * }
 */
export function checkPermission(
  req: Request,
  permission: Permission | string
): boolean {
  const authReq = req as AuthenticatedRequest;
  const userPermissions = getUserPermissions(authReq);
  return hasPermission(userPermissions, permission);
}

/**
 * Get all permissions for the current request (utility function)
 *
 * @example
 * const permissions = getRequestPermissions(req);
 * console.log('User has permissions:', permissions);
 */
export function getRequestPermissions(req: Request): string[] {
  const authReq = req as AuthenticatedRequest;
  return getUserPermissions(authReq);
}

/**
 * Attach permissions to request object (for debugging/logging)
 */
export function attachPermissions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthenticatedRequest;
  const permissions = getUserPermissions(authReq);

  // Attach to request for easy access
  (authReq as any).permissions = permissions;

  next();
}
