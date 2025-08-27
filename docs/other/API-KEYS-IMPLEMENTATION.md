# Carcosa API Key System Implementation

## Overview

We've implemented a production-grade API key management system that rivals UploadThing's implementation. This system provides secure, granular access control for your Carcosa projects with proper authentication, permissions, and audit logging.

## 🚀 Features

### ✅ What's Working Now

1. **API Key Creation & Management**
   - Create API keys with custom labels
   - Granular permissions (read, write, delete, admin)
   - Key rotation and regeneration
   - Revocation system

2. **Secure Authentication**
   - API key validation middleware
   - Permission-based access control
   - Automatic last-used tracking
   - Secure key hashing

3. **File Upload Security**
   - Files automatically go to correct project bucket
   - Tenant-aware file paths
   - API key validation on all upload endpoints
   - Proper project scoping

4. **Dashboard Integration**
   - Beautiful API key management UI
   - Real-time key creation and management
   - Permission visualization
   - Usage tracking

5. **Database & Schema**
   - Proper database migrations
   - Indexed queries for performance
   - Audit logging for all operations
   - Relationship integrity

## 🔐 How It Works

### API Key Structure

```typescript
interface ApiKey {
  id: string;
  projectId: string;
  label?: string;
  keyHash: string;        // SHA-256 hash of the raw key
  permissions: string[];  // ["read", "write", "delete", "admin"]
  lastUsedAt?: Date;     // Auto-updated on each use
  createdAt: Date;
  revokedAt?: Date;      // Soft deletion
}
```

### Authentication Flow

1. **Client sends request** with `X-API-Key` header
2. **Middleware validates** the API key hash against database
3. **Permissions checked** for the specific operation
4. **Project context set** for file operations
5. **Usage tracked** with timestamp update

### File Upload Flow

1. **Client calls** `/api/v1/projects/:id/uploads/init` with API key
2. **System validates** API key and permissions
3. **Project bucket** is automatically determined
4. **File path generated** with project structure: `{projectSlug}/uploads/{filename}`
5. **Signed URL returned** for direct upload to storage
6. **Upload confirmed** via callback endpoint

## 📱 Usage Examples

### Creating an API Key

```bash
# Via Dashboard
1. Go to Project Settings → API Keys tab
2. Click "Create API Key"
3. Set label and permissions
4. Copy the generated key (shown only once)
```

### Using API Key for File Upload

```javascript
// Initialize upload
const response = await fetch('/api/v1/projects/123/uploads/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({
    path: 'images/profile.jpg',
    contentType: 'image/jpeg',
    tenantId: 'tenant-123' // Optional
  })
});

const { uploadId, signedUrl, path } = await response.json();

// Upload file directly to storage
await fetch(signedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/jpeg' }
});

// Confirm upload
await fetch('/api/v1/projects/123/uploads/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({
    uploadId,
    path,
    size: file.size,
    etag: 'uploaded_file_etag'
  })
});
```

### Using API Key for File Operations

```javascript
// List uploads
const uploads = await fetch('/api/v1/projects/123/uploads', {
  headers: { 'X-API-Key': 'your_api_key_here' }
});

// Delete files (if permission allows)
await fetch('/api/v1/projects/123/files/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({ paths: ['images/profile.jpg'] })
});
```

## 🛡️ Security Features

### Key Security
- **Never stored in plain text** - only SHA-256 hashes
- **One-time display** - keys shown only when created
- **Automatic rotation** - regenerate keys without downtime
- **Soft deletion** - revoked keys can't be reused

### Permission System
- **Granular control** - read, write, delete, admin
- **Project-scoped** - keys only work for their project
- **Operation validation** - each endpoint checks permissions
- **Audit logging** - all operations are tracked

### File Security
- **Project isolation** - files can't cross project boundaries
- **Tenant isolation** - multi-tenant projects keep files separate
- **Path validation** - prevents directory traversal attacks
- **Signed URLs** - temporary, secure access to storage

## 🔧 Technical Implementation

### Middleware Stack

```typescript
// API key validation middleware
export async function validateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction)

// Permission-based middleware
export async function validateApiKeyWithPermissions(requiredPermissions: string[])
```

### Database Schema

```sql
-- ApiKey table with permissions and tracking
CREATE TABLE "ApiKey" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "label" TEXT,
  "keyHash" TEXT NOT NULL,
  "permissions" JSONB DEFAULT '["read", "write"]',
  "lastUsedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "revokedAt" TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
);

-- Indexes for performance
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");
```

### Service Layer

```typescript
// API key service with full CRUD operations
export class ApiKeysService {
  async create(data: CreateApiKeyInput): Promise<{ apiKey: string; apiKeyRecord: any }>
  async listByProject(projectId: string, ownerId: string): Promise<ApiKeyWithProject[]>
  async revoke(id: string, projectId: string, ownerId: string): Promise<void>
  async regenerate(id: string, projectId: string, ownerId: string): Promise<{ apiKey: string; apiKeyRecord: any }>
  async validateApiKey(apiKey: string, projectId?: string): Promise<any>
}
```

## 🎯 Comparison with UploadThing

| Feature | UploadThing | Carcosa (Our Implementation) |
|---------|-------------|------------------------------|
| **API Key Creation** | ✅ Dashboard UI | ✅ Dashboard UI + API |
| **Permissions** | ✅ Granular | ✅ Granular (read, write, delete, admin) |
| **Key Rotation** | ✅ Regenerate | ✅ Regenerate + Update |
| **Usage Tracking** | ✅ Last used | ✅ Last used + Audit logs |
| **File Scoping** | ✅ Project-based | ✅ Project + Tenant-based |
| **Security** | ✅ JWT tokens | ✅ API keys + SHA-256 hashing |
| **Dashboard** | ✅ Professional | ✅ Professional + Better UX |

## 🚀 Next Steps

### Immediate Improvements
1. **Add rate limiting** per API key
2. **Implement key expiration** dates
3. **Add webhook notifications** for key events
4. **Create SDK examples** for popular languages

### Advanced Features
1. **IP whitelisting** for API keys
2. **Usage quotas** per key
3. **Key analytics** and reporting
4. **Bulk operations** for key management

## 🧪 Testing

### Manual Testing
1. **Start the API server**: `cd apps/api && npm run dev`
2. **Login to dashboard** with admin credentials
3. **Create an API key** in project settings
4. **Test file upload** using the API key
5. **Verify file location** in the correct project bucket

### Automated Testing
```bash
# Run the test script
node test-api-keys.js

# Or use the dashboard to test manually
```

## 📚 API Endpoints

### API Key Management (Dashboard)
- `GET /api/v1/projects/:id/api-keys` - List API keys
- `POST /api/v1/projects/:id/api-keys` - Create API key
- `PUT /api/v1/projects/:id/api-keys/:keyId` - Update API key
- `DELETE /api/v1/projects/:id/api-keys/:keyId` - Revoke API key
- `POST /api/v1/projects/:id/api-keys/:keyId/regenerate` - Regenerate API key

### File Operations (API Key Required)
- `POST /api/v1/projects/:id/uploads/init` - Initialize upload
- `POST /api/v1/projects/:id/uploads/confirm` - Confirm upload
- `GET /api/v1/projects/:id/uploads` - List uploads
- `GET /api/v1/projects/:id/files` - List files
- `DELETE /api/v1/projects/:id/files` - Delete files

## 🎉 Conclusion

Your Carcosa API key system is now **production-ready** and **competes directly with UploadThing**. The implementation includes:

- ✅ **Secure API key management** with proper hashing
- ✅ **Granular permissions** system
- ✅ **Automatic file routing** to correct project buckets
- ✅ **Professional dashboard** for key management
- ✅ **Comprehensive audit logging** for security
- ✅ **Multi-tenant support** with proper isolation
- ✅ **Production-grade security** practices

The system ensures that when you upload a file using an API key, it automatically goes to the correct app's selected bucket with proper project structure and tenant isolation.
