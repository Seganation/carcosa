/**
 * File Path Isolation Utilities
 * 
 * Generates proper file paths for multi-tenant bucket sharing
 * Pattern: /{organizationSlug}/{teamSlug}/{projectSlug}/{filename}
 */

export interface ProjectContext {
  organizationSlug: string;
  teamSlug: string;
  projectSlug: string;
}

export interface FilePathOptions {
  tenantSlug?: string; // For multi-tenant projects
  version?: string;    // For file versioning
  transform?: string;  // For transform results
}

/**
 * Generate a file path with proper isolation
 * @param context - Project context (org, team, project)
 * @param filename - The filename
 * @param options - Additional path options
 * @returns Properly scoped file path
 */
export function generateFilePath(
  context: ProjectContext,
  filename: string,
  options: FilePathOptions = {}
): string {
  const { organizationSlug, teamSlug, projectSlug } = context;
  const { tenantSlug, version, transform } = options;

  // Base path: org/team/project
  let path = `${organizationSlug}/${teamSlug}/${projectSlug}`;

  // Add tenant folder for multi-tenant projects
  if (tenantSlug) {
    path += `/tenants/${tenantSlug}`;
  }

  // Add version folder
  if (version && version !== "v1") {
    path += `/versions/${version}`;
  }

  // Add transform folder
  if (transform) {
    path += `/transforms/${transform}`;
  }

  // Add filename
  path += `/${filename}`;

  return path;
}

/**
 * Generate a tenant-scoped file path
 * @param context - Project context
 * @param tenantSlug - Tenant identifier
 * @param filename - The filename
 * @param options - Additional options
 * @returns Tenant-scoped file path
 */
export function generateTenantFilePath(
  context: ProjectContext,
  tenantSlug: string,
  filename: string,
  options: Omit<FilePathOptions, 'tenantSlug'> = {}
): string {
  return generateFilePath(context, filename, { ...options, tenantSlug });
}

/**
 * Generate a transform result path
 * @param context - Project context
 * @param originalFilename - Original file name
 * @param transformId - Transform identifier (e.g., "800x600", "thumbnail")
 * @param options - Additional options
 * @returns Transform result file path
 */
export function generateTransformPath(
  context: ProjectContext,
  originalFilename: string,
  transformId: string,
  options: FilePathOptions = {}
): string {
  // Extract file extension
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? originalFilename.slice(0, lastDotIndex) : originalFilename;
  const ext = lastDotIndex > 0 ? originalFilename.slice(lastDotIndex) : '';
  
  // Create transform filename
  const transformFilename = `${name}-${transformId}${ext}`;
  
  return generateFilePath(context, transformFilename, {
    ...options,
    transform: transformId,
  });
}

/**
 * Generate upload directory path (without filename)
 * @param context - Project context
 * @param options - Path options
 * @returns Directory path for uploads
 */
export function generateUploadPath(
  context: ProjectContext,
  options: FilePathOptions = {}
): string {
  const { organizationSlug, teamSlug, projectSlug } = context;
  const { tenantSlug, version } = options;

  let path = `${organizationSlug}/${teamSlug}/${projectSlug}`;

  if (tenantSlug) {
    path += `/tenants/${tenantSlug}`;
  }

  if (version && version !== "v1") {
    path += `/versions/${version}`;
  }

  path += "/uploads";

  return path;
}

/**
 * Parse a file path to extract context information
 * @param filePath - The full file path
 * @returns Parsed path components or null if invalid
 */
export function parseFilePath(filePath: string): {
  organizationSlug: string;
  teamSlug: string;
  projectSlug: string;
  tenantSlug?: string;
  version?: string;
  transform?: string;
  filename: string;
} | null {
  const parts = filePath.split('/').filter(Boolean);
  
  if (parts.length < 4) {
    return null; // Invalid path
  }

  const [organizationSlug, teamSlug, projectSlug, ...rest] = parts;

  // These are required, so return null if any are missing
  if (!organizationSlug || !teamSlug || !projectSlug) {
    return null;
  }

  let remainingParts = [...rest];
  let tenantSlug: string | undefined;
  let version: string | undefined;
  let transform: string | undefined;

  // Check for tenant folder
  if (remainingParts[0] === 'tenants' && remainingParts.length > 2) {
    tenantSlug = remainingParts[1];
    remainingParts = remainingParts.slice(2);
  }

  // Check for version folder
  if (remainingParts[0] === 'versions' && remainingParts.length > 2) {
    version = remainingParts[1];
    remainingParts = remainingParts.slice(2);
  }

  // Check for transform folder
  if (remainingParts[0] === 'transforms' && remainingParts.length > 2) {
    transform = remainingParts[1];
    remainingParts = remainingParts.slice(2);
  }

  // Check for uploads folder (skip it)
  if (remainingParts[0] === 'uploads') {
    remainingParts = remainingParts.slice(1);
  }

  const filename = remainingParts.join('/'); // In case of nested folders

  if (!filename) {
    return null;
  }

  return {
    organizationSlug,
    teamSlug,
    projectSlug,
    tenantSlug,
    version,
    transform,
    filename,
  };
}

/**
 * Validate that a file path follows the correct isolation pattern
 * @param filePath - File path to validate
 * @param allowedContext - Expected project context
 * @returns True if path is valid and matches context
 */
export function validateFilePath(
  filePath: string,
  allowedContext: ProjectContext
): boolean {
  const parsed = parseFilePath(filePath);
  
  if (!parsed) {
    return false;
  }

  return (
    parsed.organizationSlug === allowedContext.organizationSlug &&
    parsed.teamSlug === allowedContext.teamSlug &&
    parsed.projectSlug === allowedContext.projectSlug
  );
}

/**
 * Sanitize a slug for use in file paths
 * @param input - Raw string to convert to slug
 * @returns Safe slug for file paths
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Generate example file paths for documentation
 */
export const FILE_PATH_EXAMPLES = {
  // Basic file upload
  basic: "acme-corp/backend-team/ecommerce-api/user-avatar.jpg",
  
  // Multi-tenant file
  tenant: "acme-corp/backend-team/ecommerce-api/tenants/client-a/logo.png",
  
  // Versioned file
  versioned: "acme-corp/backend-team/ecommerce-api/versions/v2/schema.json",
  
  // Transform result
  transform: "acme-corp/backend-team/ecommerce-api/transforms/thumbnail/user-avatar-100x100.jpg",
  
  // Complex multi-tenant with version and transform
  complex: "acme-corp/marketing-team/landing-page/tenants/client-b/versions/v3/transforms/800x600/hero-image-800x600.webp",
};

export default {
  generateFilePath,
  generateTenantFilePath,
  generateTransformPath,
  generateUploadPath,
  parseFilePath,
  validateFilePath,
  sanitizeSlug,
  FILE_PATH_EXAMPLES,
};
