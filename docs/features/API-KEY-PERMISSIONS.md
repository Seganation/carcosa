# API Key Permission System

**Date**: November 13, 2025
**Status**: ✅ Complete - Task 2.16
**Session**: 15

---

## 🎯 Overview

Carcosa implements a granular, resource-based permission system for API keys. This allows fine-grained control over what operations each API key can perform, following the principle of least privilege.

### Key Features

- **17 granular permissions** covering all API operations
- **Resource-based naming** (e.g., `files:read`, `uploads:create`)
- **Wildcard support** for resource-level (`files:*`) and global (`*`) access
- **Permission groups** for common use cases (READ_ONLY, STANDARD, FULL, ADMIN)
- **Backward compatible** with old permission format (`read`, `write`, `delete`, `admin`)
- **Type-safe** with full TypeScript support

---

## 📋 Available Permissions

### Read Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `files:read` | Read and list files | File browser, download files |
| `projects:read` | View project details | Get project info, settings |
| `transforms:read` | View image transforms | List transform history |
| `usage:read` | View usage statistics | Analytics, billing dashboard |
| `audit_logs:read` | View audit logs | Compliance, security monitoring |

### Write Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `files:write` | Update file metadata | Rename files, update tags |
| `projects:write` | Update project settings | Configure project, update limits |

### Delete Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `files:delete` | Delete files | File cleanup, user-initiated deletion |
| `transforms:delete` | Delete transforms | Transform cache cleanup |

### Upload Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `uploads:create` | Upload new files | Standard file upload |
| `uploads:init` | Initialize file uploads | Multi-part upload (step 1) |
| `uploads:complete` | Complete file uploads | Multi-part upload (step 3) |

### Transform Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `transforms:create` | Create image transforms | Generate thumbnails, resize |
| `transforms:request` | Request image transformations | On-demand transform endpoint |

### Admin Permissions

| Permission | Description | Use Case |
|-----------|-------------|----------|
| `api_keys:manage` | Manage API keys | Create, revoke, regenerate keys |
| `rate_limits:manage` | Manage rate limits | Configure rate limit settings |
| `*` | All permissions (wildcard) | Full access to everything |

---

## 🎨 Permission Groups

Permission groups are predefined sets of permissions for common use cases.

### READ_ONLY

**Use case**: Read-only access for analytics, monitoring, or auditing.

```json
{
  "permissionGroup": "READ_ONLY"
}
```

**Includes**:
- `files:read`
- `projects:read`
- `transforms:read`
- `usage:read`
- `audit_logs:read`

**Example**: Analytics dashboard that displays file statistics but cannot modify anything.

---

### STANDARD

**Use case**: Standard application access for uploading files and requesting transforms.

```json
{
  "permissionGroup": "STANDARD"
}
```

**Includes**:
- All READ_ONLY permissions
- `files:write`
- `uploads:create`
- `uploads:init`
- `uploads:complete`
- `transforms:create`
- `transforms:request`

**Example**: Web application that allows users to upload images and request transformations.

---

### FULL

**Use case**: Full access to all operations except administrative tasks.

```json
{
  "permissionGroup": "FULL"
}
```

**Includes**:
- All STANDARD permissions
- `files:delete`
- `transforms:delete`
- `projects:write`

**Example**: Backend service that needs complete control over files and transforms.

---

### ADMIN

**Use case**: Administrative access with full control.

```json
{
  "permissionGroup": "ADMIN"
}
```

**Includes**:
- `*` (wildcard - all permissions)

**Example**: Dashboard management, CI/CD pipelines, infrastructure automation.

---

## 🚀 Usage Examples

### Creating API Keys

#### Using Permission Group (Recommended)

```bash
curl -X POST http://localhost:4000/api/v1/projects/PROJECT_ID/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Production Upload Service",
    "permissionGroup": "STANDARD"
  }'
```

#### Using Individual Permissions

```bash
curl -X POST http://localhost:4000/api/v1/projects/PROJECT_ID/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Custom Read-Write Key",
    "permissions": [
      "files:read",
      "files:write",
      "uploads:init",
      "uploads:complete"
    ]
  }'
```

#### Read-Only Analytics Key

```bash
curl -X POST http://localhost:4000/api/v1/projects/PROJECT_ID/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Analytics Dashboard",
    "permissionGroup": "READ_ONLY"
  }'
```

#### Admin Key (Full Access)

```bash
curl -X POST http://localhost:4000/api/v1/projects/PROJECT_ID/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Admin Access",
    "permissions": ["*"]
  }'
```

---

### Using API Keys

Once created, use the API key in the `x-api-key` header or `Authorization: Bearer` header:

```bash
# Using x-api-key header (recommended)
curl -X GET http://localhost:4000/api/v1/projects/PROJECT_ID/files \
  -H "x-api-key: YOUR_API_KEY"

# Using Authorization Bearer header
curl -X GET http://localhost:4000/api/v1/projects/PROJECT_ID/files \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 🔐 Permission Wildcards

### Resource-Level Wildcard

Grant all permissions for a specific resource:

```json
{
  "permissions": ["files:*"]
}
```

**Equivalent to**:
- `files:read`
- `files:write`
- `files:delete`

### Global Wildcard

Grant all permissions (admin access):

```json
{
  "permissions": ["*"]
}
```

**Important**: Wildcard `*` cannot be combined with other permissions. If provided, it must be the only permission.

---

## 🛡️ Permission Enforcement

### Middleware Stack

Permissions are enforced using Express middleware:

```typescript
router.get(
  "/projects/:id/files",
  authMiddleware,                        // 1. Authenticate user/API key
  requirePermission(Permission.READ_FILES),  // 2. Check permission
  Files.list                             // 3. Execute controller
);
```

### Permission Check Logic

1. **Wildcard check**: Does user have `*` permission?
2. **Exact match**: Does user have the exact permission (e.g., `files:read`)?
3. **Resource wildcard**: Does user have resource wildcard (e.g., `files:*`)?

If any of these match, permission is granted.

### Multiple Permissions (OR)

Require ANY of multiple permissions:

```typescript
router.get(
  "/admin/stats",
  authMiddleware,
  requirePermission([Permission.READ_USAGE, Permission.ALL]),
  getStats
);
```

User needs either `usage:read` OR `*` to access this endpoint.

### Multiple Permissions (AND)

Require ALL of multiple permissions:

```typescript
router.post(
  "/projects/:id/dangerous-operation",
  authMiddleware,
  requireAllPermissions([
    Permission.WRITE_FILES,
    Permission.DELETE_FILES
  ]),
  dangerousOperation
);
```

User needs BOTH `files:write` AND `files:delete`.

---

## 📊 Protected Endpoints

### File Operations

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/projects/:id/files` | GET | `files:read` |
| `/projects/:id/files/:fileId/download` | GET | `files:read` |
| `/projects/:id/files` | DELETE | `files:delete` |

### Upload Operations

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/carcosa/init` | POST | `uploads:init` |
| `/carcosa/complete` | POST | `uploads:complete` |
| `/carcosa/images` | POST | `uploads:create` |
| `/carcosa/documents` | POST | `uploads:create` |
| `/carcosa/videos` | POST | `uploads:create` |

### Transform Operations

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/transform/:projectId/*` | GET | Public (no auth) |
| `/projects/:id/transforms` | GET | `transforms:read` |
| `/projects/:id/transforms/stats` | GET | `transforms:read` |
| `/projects/:id/transforms/:id/retry` | POST | `transforms:create` |
| `/projects/:id/transforms/:id` | DELETE | `transforms:delete` |

### API Key Management

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/projects/:id/api-keys` | GET | `api_keys:manage` |
| `/projects/:id/api-keys` | POST | `api_keys:manage` |
| `/projects/:id/api-keys/:keyId` | PUT | `api_keys:manage` |
| `/projects/:id/api-keys/:keyId` | DELETE | `api_keys:manage` |
| `/projects/:id/api-keys/:keyId/regenerate` | POST | `api_keys:manage` |

---

## 🔧 Implementation Details

### Type Definitions

**Location**: `apps/api/src/types/permissions.ts`

```typescript
export enum Permission {
  READ_FILES = 'files:read',
  WRITE_FILES = 'files:write',
  DELETE_FILES = 'files:delete',
  // ... etc
}

export const PermissionGroups = {
  READ_ONLY: [Permission.READ_FILES, ...],
  STANDARD: [Permission.READ_FILES, Permission.UPLOAD_FILES, ...],
  FULL: [/* all non-admin */],
  ADMIN: [Permission.ALL],
};
```

### Validation Schema

**Location**: `apps/api/src/validations/api-keys.validation.ts`

```typescript
export const createApiKeyWithGroupSchema = z.object({
  label: z.string().optional(),
  permissions: permissionsArraySchema.optional(),
  permissionGroup: permissionGroupSchema.optional(),
});
```

### Middleware

**Location**: `apps/api/src/middlewares/permissions.middleware.ts`

```typescript
export function requirePermission(
  requiredPermissions: Permission | Permission[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user has required permissions
    // Throws 403 if not authorized
  };
}
```

### API Key Middleware

**Location**: `apps/api/src/middlewares/api-key.middleware.ts`

Parses permissions from database and attaches to `req.apiKey.permissions`.

---

## 🔄 Migration from Old Format

Old permission format (`read`, `write`, `delete`, `admin`) is automatically migrated to new format:

| Old Permission | New Permissions |
|---------------|-----------------|
| `read` | `files:read`, `projects:read`, `transforms:read`, `usage:read` |
| `write` | `files:write`, `uploads:create`, `uploads:init`, `uploads:complete`, `transforms:create`, `transforms:request` |
| `delete` | `files:delete`, `transforms:delete` |
| `admin` | `*` (all permissions) |

Migration helper available in `permissions.ts`:

```typescript
import { migrateOldPermissions } from './types/permissions.js';

const oldPerms = ['read', 'write'];
const newPerms = migrateOldPermissions(oldPerms);
// Result: ['files:read', 'projects:read', ..., 'uploads:create', ...]
```

---

## ✅ Validation Rules

### Permission Format

- Must be in format `resource:action` (e.g., `files:read`)
- Or a valid predefined permission from `Permission` enum
- Or wildcard `*`
- Or resource wildcard `resource:*` (e.g., `files:*`)

### Validation Constraints

1. **Minimum 1 permission** required
2. **Maximum 50 permissions** allowed
3. **Wildcard exclusivity**: If `*` is provided, it must be the only permission
4. **No duplicates** in permission array

### Invalid Examples

```json
// ❌ Invalid: Empty permissions array
{ "permissions": [] }

// ❌ Invalid: Wildcard with other permissions
{ "permissions": ["*", "files:read"] }

// ❌ Invalid: Invalid format
{ "permissions": ["read_files"] }

// ❌ Invalid: Unknown resource
{ "permissions": ["foo:bar"] }
```

### Valid Examples

```json
// ✅ Valid: Single permission
{ "permissions": ["files:read"] }

// ✅ Valid: Multiple permissions
{ "permissions": ["files:read", "files:write"] }

// ✅ Valid: Resource wildcard
{ "permissions": ["files:*"] }

// ✅ Valid: Global wildcard (alone)
{ "permissions": ["*"] }

// ✅ Valid: Permission group
{ "permissionGroup": "STANDARD" }
```

---

## 🧪 Testing Permissions

### Test Read-Only Key

```bash
# Create read-only key
API_KEY=$(curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/api-keys \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Test Read-Only","permissionGroup":"READ_ONLY"}' \
  | jq -r '.apiKey')

# ✅ Should succeed (has files:read)
curl -H "x-api-key: $API_KEY" \
  http://localhost:4000/api/v1/projects/$PROJECT_ID/files

# ❌ Should fail with 403 (missing files:delete)
curl -X DELETE -H "x-api-key: $API_KEY" \
  http://localhost:4000/api/v1/projects/$PROJECT_ID/files
```

### Test Upload Key

```bash
# Create upload key
API_KEY=$(curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/api-keys \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Test Upload","permissions":["uploads:init","uploads:complete"]}' \
  | jq -r '.apiKey')

# ✅ Should succeed (has uploads:init)
curl -X POST -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","fileSize":12345,"contentType":"image/jpeg"}' \
  http://localhost:4000/api/v1/carcosa/init

# ❌ Should fail with 403 (missing files:read)
curl -H "x-api-key: $API_KEY" \
  http://localhost:4000/api/v1/projects/$PROJECT_ID/files
```

---

## 📚 Best Practices

### 1. Use Permission Groups

**Prefer**:
```json
{ "permissionGroup": "STANDARD" }
```

**Over**:
```json
{
  "permissions": [
    "files:read",
    "files:write",
    "uploads:create",
    "uploads:init",
    "uploads:complete",
    "transforms:create",
    "transforms:request"
  ]
}
```

**Why**: Permission groups are maintained and updated as the API evolves.

### 2. Principle of Least Privilege

Grant only the permissions needed for the specific use case.

**Good**: Analytics service with READ_ONLY
**Bad**: Analytics service with ADMIN

### 3. Label API Keys Clearly

Use descriptive labels that indicate the purpose and permissions:

```json
{
  "label": "Production Upload Service (STANDARD)",
  "permissionGroup": "STANDARD"
}
```

### 4. Rotate Keys Regularly

Use the regenerate endpoint to rotate keys without changing permissions:

```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/api-keys/$KEY_ID/regenerate \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 5. Revoke Unused Keys

Regularly audit and revoke unused API keys:

```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/api-keys/$KEY_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 🔍 Debugging Permissions

### Check API Key Permissions

List all API keys for a project:

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:4000/api/v1/projects/$PROJECT_ID/api-keys
```

Response includes permissions for each key:

```json
{
  "apiKeys": [
    {
      "id": "key-123",
      "label": "Upload Service",
      "permissions": ["files:read", "uploads:create", "uploads:init", "uploads:complete"],
      "createdAt": "2025-11-13T10:00:00.000Z",
      "lastUsedAt": "2025-11-13T15:30:00.000Z"
    }
  ]
}
```

### Permission Denied Response

When a permission check fails, the API returns a 403 error with details:

```json
{
  "error": "forbidden",
  "message": "Missing required permission(s): files:delete",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": ["files:delete"],
  "current": ["files:read", "files:write"]
}
```

---

## 📖 Related Documentation

- **Database Optimization**: `DATABASE-OPTIMIZATION.md`
- **API Documentation**: `http://localhost:4000/api/v1/docs`
- **Session 15 Summary**: `SESSION-15-COMPLETE.md`
- **Project Roadmap**: `ROADMAP.md`

---

## 🎯 Future Enhancements

1. **Rate limit per permission**: Different rate limits for read vs write operations
2. **Time-based permissions**: Temporary access grants (e.g., 24-hour upload key)
3. **IP whitelist**: Restrict API keys to specific IP ranges
4. **Webhook permissions**: Dedicated permissions for webhook endpoints
5. **Scoped permissions**: Project-level or tenant-level permission scopes

---

**Status**: ✅ Complete - Task 2.16 (API Key Permission Refinement)
**Next Task**: Task 2.17 - Rate limiting optimization
