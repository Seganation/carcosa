/**
 * API Key Permission System
 *
 * Defines granular permissions for API keys to control access to different operations.
 */

/**
 * Available API key permissions
 */
export enum Permission {
  // Read permissions
  READ_FILES = 'files:read',
  READ_PROJECTS = 'projects:read',
  READ_TRANSFORMS = 'transforms:read',
  READ_USAGE = 'usage:read',
  READ_AUDIT_LOGS = 'audit_logs:read',

  // Write permissions
  WRITE_FILES = 'files:write',
  WRITE_PROJECTS = 'projects:write',

  // Delete permissions
  DELETE_FILES = 'files:delete',
  DELETE_TRANSFORMS = 'transforms:delete',

  // Upload permissions
  UPLOAD_FILES = 'uploads:create',
  UPLOAD_INIT = 'uploads:init',
  UPLOAD_COMPLETE = 'uploads:complete',

  // Transform permissions
  TRANSFORM_CREATE = 'transforms:create',
  TRANSFORM_REQUEST = 'transforms:request',

  // Admin permissions
  MANAGE_API_KEYS = 'api_keys:manage',
  MANAGE_RATE_LIMITS = 'rate_limits:manage',

  // Wildcard (all permissions)
  ALL = '*',
}

/**
 * Permission groups for common use cases
 */
export const PermissionGroups = {
  /**
   * Read-only access to all resources
   */
  READ_ONLY: [
    Permission.READ_FILES,
    Permission.READ_PROJECTS,
    Permission.READ_TRANSFORMS,
    Permission.READ_USAGE,
    Permission.READ_AUDIT_LOGS,
  ],

  /**
   * Standard access (read + write + upload + transform)
   */
  STANDARD: [
    Permission.READ_FILES,
    Permission.READ_PROJECTS,
    Permission.READ_TRANSFORMS,
    Permission.WRITE_FILES,
    Permission.UPLOAD_FILES,
    Permission.UPLOAD_INIT,
    Permission.UPLOAD_COMPLETE,
    Permission.TRANSFORM_CREATE,
    Permission.TRANSFORM_REQUEST,
  ],

  /**
   * Full access (all operations except admin)
   */
  FULL: [
    Permission.READ_FILES,
    Permission.READ_PROJECTS,
    Permission.READ_TRANSFORMS,
    Permission.READ_USAGE,
    Permission.READ_AUDIT_LOGS,
    Permission.WRITE_FILES,
    Permission.WRITE_PROJECTS,
    Permission.DELETE_FILES,
    Permission.DELETE_TRANSFORMS,
    Permission.UPLOAD_FILES,
    Permission.UPLOAD_INIT,
    Permission.UPLOAD_COMPLETE,
    Permission.TRANSFORM_CREATE,
    Permission.TRANSFORM_REQUEST,
  ],

  /**
   * Admin access (all permissions including management)
   */
  ADMIN: [Permission.ALL],
} as const;

/**
 * Permission requirements for common operations
 */
export const OperationPermissions = {
  // File operations
  LIST_FILES: [Permission.READ_FILES],
  GET_FILE: [Permission.READ_FILES],
  UPLOAD_FILE: [Permission.UPLOAD_FILES, Permission.UPLOAD_INIT, Permission.UPLOAD_COMPLETE],
  DELETE_FILE: [Permission.DELETE_FILES],
  UPDATE_FILE_METADATA: [Permission.WRITE_FILES],

  // Transform operations
  REQUEST_TRANSFORM: [Permission.TRANSFORM_REQUEST],
  CREATE_TRANSFORM: [Permission.TRANSFORM_CREATE],
  LIST_TRANSFORMS: [Permission.READ_TRANSFORMS],
  DELETE_TRANSFORM: [Permission.DELETE_TRANSFORMS],

  // Project operations
  GET_PROJECT: [Permission.READ_PROJECTS],
  UPDATE_PROJECT: [Permission.WRITE_PROJECTS],

  // Usage operations
  GET_USAGE_STATS: [Permission.READ_USAGE],
  GET_AUDIT_LOGS: [Permission.READ_AUDIT_LOGS],

  // API key operations
  CREATE_API_KEY: [Permission.MANAGE_API_KEYS],
  DELETE_API_KEY: [Permission.MANAGE_API_KEYS],
  LIST_API_KEYS: [Permission.MANAGE_API_KEYS],

  // Rate limit operations
  UPDATE_RATE_LIMITS: [Permission.MANAGE_RATE_LIMITS],
} as const;

/**
 * Check if a permission set includes a required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission | string
): boolean {
  // Check for wildcard permission
  if (userPermissions.includes(Permission.ALL)) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for resource-level wildcard (e.g., "files:*" includes "files:read")
  const [resource] = requiredPermission.split(':');
  const resourceWildcard = `${resource}:*`;
  if (userPermissions.includes(resourceWildcard)) {
    return true;
  }

  return false;
}

/**
 * Check if a permission set includes ANY of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: (Permission | string)[]
): boolean {
  return requiredPermissions.some(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if a permission set includes ALL of the required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: (Permission | string)[]
): boolean {
  return requiredPermissions.every(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Validate permission string format
 */
export function isValidPermission(permission: string): boolean {
  // Check if it's a known permission
  const allPermissions = Object.values(Permission);
  if (allPermissions.includes(permission as Permission)) {
    return true;
  }

  // Check if it follows the pattern "resource:action" or "resource:*"
  const permissionPattern = /^[a-z_]+:(read|write|delete|create|manage|\*)$/;
  return permissionPattern.test(permission);
}

/**
 * Filter permissions to only valid ones
 */
export function sanitizePermissions(permissions: string[]): string[] {
  return permissions.filter(isValidPermission);
}

/**
 * Get human-readable description for a permission
 */
export function getPermissionDescription(permission: Permission | string): string {
  const descriptions: Record<string, string> = {
    [Permission.READ_FILES]: 'Read and list files',
    [Permission.READ_PROJECTS]: 'View project details',
    [Permission.READ_TRANSFORMS]: 'View image transforms',
    [Permission.READ_USAGE]: 'View usage statistics',
    [Permission.READ_AUDIT_LOGS]: 'View audit logs',

    [Permission.WRITE_FILES]: 'Update file metadata',
    [Permission.WRITE_PROJECTS]: 'Update project settings',

    [Permission.DELETE_FILES]: 'Delete files',
    [Permission.DELETE_TRANSFORMS]: 'Delete transforms',

    [Permission.UPLOAD_FILES]: 'Upload new files',
    [Permission.UPLOAD_INIT]: 'Initialize file uploads',
    [Permission.UPLOAD_COMPLETE]: 'Complete file uploads',

    [Permission.TRANSFORM_CREATE]: 'Create image transforms',
    [Permission.TRANSFORM_REQUEST]: 'Request image transformations',

    [Permission.MANAGE_API_KEYS]: 'Manage API keys',
    [Permission.MANAGE_RATE_LIMITS]: 'Manage rate limits',

    [Permission.ALL]: 'Full access to all operations',
  };

  return descriptions[permission] || permission;
}

/**
 * Migration helper: Convert old permission format to new format
 */
export function migrateOldPermissions(oldPermissions: string[]): string[] {
  const migrationMap: Record<string, Permission[]> = {
    'read': [
      Permission.READ_FILES,
      Permission.READ_PROJECTS,
      Permission.READ_TRANSFORMS,
      Permission.READ_USAGE,
    ],
    'write': [
      Permission.WRITE_FILES,
      Permission.UPLOAD_FILES,
      Permission.UPLOAD_INIT,
      Permission.UPLOAD_COMPLETE,
      Permission.TRANSFORM_CREATE,
      Permission.TRANSFORM_REQUEST,
    ],
    'delete': [
      Permission.DELETE_FILES,
      Permission.DELETE_TRANSFORMS,
    ],
    'admin': [Permission.ALL],
  };

  const newPermissions: Permission[] = [];

  for (const oldPermission of oldPermissions) {
    const mapped = migrationMap[oldPermission];
    if (mapped) {
      newPermissions.push(...mapped);
    }
  }

  // Remove duplicates
  return Array.from(new Set(newPermissions));
}
