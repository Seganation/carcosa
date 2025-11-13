import { z } from "zod";
import { Permission, PermissionGroups, isValidPermission } from "../types/permissions.js";

/**
 * All valid permission values for API keys
 */
const allPermissions = Object.values(Permission);

/**
 * Zod schema for a single permission
 */
export const permissionSchema = z.string().refine(
  (permission) => isValidPermission(permission),
  {
    message: "Invalid permission format. Must be in format 'resource:action' (e.g., 'files:read') or a valid predefined permission.",
  }
);

/**
 * Zod schema for permission array with validation
 */
export const permissionsArraySchema = z
  .array(permissionSchema)
  .min(1, "At least one permission is required")
  .max(50, "Maximum 50 permissions allowed")
  .refine(
    (permissions) => {
      // If wildcard permission is included, it should be the only one
      if (permissions.includes(Permission.ALL) && permissions.length > 1) {
        return false;
      }
      return true;
    },
    {
      message: "Wildcard permission ('*') cannot be combined with other permissions",
    }
  );

/**
 * Schema for creating a new API key
 */
export const createApiKeySchema = z.object({
  label: z
    .string()
    .min(1, "Label must not be empty")
    .max(100, "Label must not exceed 100 characters")
    .optional(),

  permissions: permissionsArraySchema.default([...PermissionGroups.STANDARD]),

  // Optional: Expiration date for API key
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * Schema for updating an API key
 */
export const updateApiKeySchema = z.object({
  label: z
    .string()
    .min(1, "Label must not be empty")
    .max(100, "Label must not exceed 100 characters")
    .optional(),

  permissions: permissionsArraySchema.optional(),
});

/**
 * Schema for using a permission group preset
 */
export const permissionGroupSchema = z.enum([
  "READ_ONLY",
  "STANDARD",
  "FULL",
  "ADMIN",
]);

/**
 * Extended create schema that allows using permission group presets
 */
export const createApiKeyWithGroupSchema = z.object({
  label: z
    .string()
    .min(1, "Label must not be empty")
    .max(100, "Label must not exceed 100 characters")
    .optional(),

  // Either specify individual permissions OR use a group
  permissions: permissionsArraySchema.optional(),
  permissionGroup: permissionGroupSchema.optional(),

  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
}).refine(
  (data) => {
    // Must provide either permissions or permissionGroup, but not both
    const hasPermissions = data.permissions && data.permissions.length > 0;
    const hasGroup = !!data.permissionGroup;
    return hasPermissions !== hasGroup; // XOR: one but not both
  },
  {
    message: "Provide either 'permissions' array or 'permissionGroup', but not both",
  }
);

/**
 * Helper to resolve permission group to actual permissions
 */
export function resolvePermissionGroup(
  group: keyof typeof PermissionGroups
): string[] {
  return [...PermissionGroups[group]];
}

/**
 * Helper to get final permissions from create schema input
 */
export function getFinalPermissions(
  input: z.infer<typeof createApiKeyWithGroupSchema>
): string[] {
  if (input.permissionGroup) {
    return resolvePermissionGroup(input.permissionGroup);
  }
  return input.permissions || [...PermissionGroups.STANDARD];
}

// Export types
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type CreateApiKeyWithGroupInput = z.infer<typeof createApiKeyWithGroupSchema>;
export type PermissionGroup = z.infer<typeof permissionGroupSchema>;
