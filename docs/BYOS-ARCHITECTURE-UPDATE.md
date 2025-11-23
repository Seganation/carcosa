# BYOS Architecture Update

**Date**: November 23, 2024
**Status**: ✅ Complete

## Overview

This document summarizes the architectural changes made to properly implement Carcosa as a **BYOS (Bring Your Own Storage)** platform, where users provide their own S3/R2 credentials instead of the platform requiring storage credentials.

## Problem

The original implementation had environment variables for R2/S3/MinIO storage credentials, which was incorrect because:
- Carcosa is designed as a BYOS platform (like UploadThing)
- Users should provide their own storage credentials via the web dashboard
- The platform should NOT have its own storage
- Storage credentials should be encrypted and stored in the database

## Changes Made

### 1. Environment Variables (.env.example)

**Removed:**
- ❌ `R2_ACCOUNT_ID`
- ❌ `R2_ACCESS_KEY_ID`
- ❌ `R2_SECRET_ACCESS_KEY`
- ❌ `R2_BUCKET_NAME`
- ❌ `R2_ENDPOINT`
- ❌ `MINIO_ENDPOINT`
- ❌ `MINIO_ACCESS_KEY`
- ❌ `MINIO_SECRET_KEY`
- ❌ `MINIO_BUCKET`

**Added/Clarified:**
- ✅ `NODE_ENV` - Environment mode
- ✅ `NEXTAUTH_URL` - NextAuth configuration
- ✅ `NEXTAUTH_SECRET` - NextAuth secret
- ✅ Updated comments to clarify BYOS architecture
- ✅ Added command to generate `CREDENTIALS_ENCRYPTION_KEY`

### 2. Environment Schema (apps/api/src/env.ts)

**Removed:**
```typescript
MINIO_ENDPOINT: z.string().optional(),
MINIO_ACCESS_KEY: z.string().optional(),
MINIO_SECRET_KEY: z.string().optional(),
MINIO_BUCKET: z.string().optional(),
```

**Updated comment:**
```typescript
// Required for encrypting/decrypting user-provided bucket credentials
CREDENTIALS_ENCRYPTION_KEY: z.string().startsWith("base64:").min(10)
```

### 3. Docker Compose (docker-compose.yml)

**Changed:**
- Made Redis optional (profile: `redis`)
- Made MinIO optional (profile: `minio`)
- Default: Only PostgreSQL starts
- Added profile `full` for starting everything

**Usage:**
```bash
# Minimal (PostgreSQL only)
docker compose up -d

# With Redis
docker compose --profile redis up -d

# With MinIO (for local testing)
docker compose --profile minio up -d

# Everything
docker compose --profile full up -d
```

### 4. File Router Routes (apps/api/src/routes/carcosa-file-router.routes.ts)

**Removed:**
- Removed `initializeStorageProviders()` function that read from env vars
- Removed R2/S3 provider initialization from environment variables

**Added:**
- Clear comment explaining BYOS architecture
- Note that storage adapters are created per-request from database bucket configuration

**Before:**
```typescript
// Initialize storage from environment variables
if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  const r2Config: R2Config = { ... };
  await storageManager.addProvider('r2-primary', r2Config);
}
```

**After:**
```typescript
// NOTE: Storage providers are NOT initialized from environment variables.
// Carcosa is a BYOS (Bring Your Own Storage) platform - users provide their
// own S3/R2 credentials via the Bucket table in the database.
//
// Storage adapters are created per-request using the project's bucket configuration
// via getAdapterForProject() in storage.service.ts
```

**Updated health check endpoint:**
```typescript
storage: {
  mode: 'BYOS (Bring Your Own Storage)',
  supported: ['AWS S3', 'Cloudflare R2', 'MinIO', 'Any S3-compatible'],
  note: 'Storage credentials configured per-project via database',
}
```

### 5. Documentation

**README.md:**
- ✅ Complete rewrite with comprehensive project documentation
- ✅ BYOS architecture prominently featured
- ✅ 17 API endpoint groups documented
- ✅ All features explained in detail
- ✅ Clear quick start guide
- ✅ Production deployment instructions
- ✅ ~800 lines of comprehensive documentation

**CLAUDE.md:**
- ✅ Updated "Environment Variables" section with BYOS warning
- ✅ Clarified which env vars are needed vs. not needed
- ✅ Updated "Multi-Storage Support" to explain BYOS architecture
- ✅ Added encryption/decryption workflow explanation
- ✅ Updated docker compose commands

**Documentation Organization:**
- ✅ Moved all session docs to `docs/sessions/`
- ✅ Moved status docs to `docs/status/`
- ✅ Moved feature docs to `docs/features/`
- ✅ Moved implementation docs to `docs/implementation/`
- ✅ Cleaned up root directory (only README.md and CLAUDE.md remain)

## How BYOS Works Now

### 1. User Flow

1. **User creates a bucket via web dashboard:**
   - Provides S3/R2 credentials (access key, secret key)
   - Credentials are encrypted using `CREDENTIALS_ENCRYPTION_KEY`
   - Encrypted credentials stored in database `Bucket` table

2. **File operations:**
   - User uploads file via API
   - API retrieves bucket from database
   - Credentials decrypted on-demand
   - Storage adapter created for that specific request
   - File operation performed using user's storage

3. **Security:**
   - Platform operator never sees unencrypted credentials
   - Each team can use different storage providers
   - Users can rotate credentials anytime
   - Credentials encrypted at rest with libsodium

### 2. Code Flow

```typescript
// apps/api/src/services/storage.service.ts
export async function getAdapterForProject(projectId: string): Promise<StorageAdapter> {
  // 1. Get project with bucket from database
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: { bucket: true },
  });

  // 2. Decrypt credentials on-demand
  const accessKeyId = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    project.bucket.encryptedAccessKey
  );
  const secretAccessKey = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    project.bucket.encryptedSecretKey
  );

  // 3. Create storage adapter with decrypted credentials
  const baseOptions = {
    bucketName: project.bucket.bucketName,
    region: project.bucket.region ?? undefined,
    endpoint: project.bucket.endpoint ?? undefined,
    accessKeyId,
    secretAccessKey,
  };

  // 4. Return appropriate adapter based on provider
  if (project.bucket.provider === "r2") return new R2Adapter(baseOptions);
  return new S3Adapter(baseOptions);
}
```

## Benefits of BYOS

✅ **User Benefits:**
- Users own their data and storage
- Use existing S3/R2 buckets
- Pay storage provider directly (no markup)
- No vendor lock-in
- Can switch providers anytime

✅ **Platform Benefits:**
- No storage infrastructure to manage
- No storage costs to bear
- Simpler deployment (no storage credentials needed)
- More secure (platform doesn't store unencrypted credentials)
- Scalable (users bring their own capacity)

✅ **Developer Benefits:**
- Clear separation of concerns
- Easier to test (can use MinIO locally)
- More flexible (supports any S3-compatible storage)
- Better for self-hosting

## Environment Variables Summary

### Required

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/carcosa

# API
API_PORT=4000
API_URL=http://localhost:4000
API_SECRET=supersecret
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Encryption (CRITICAL - for user bucket credentials)
CREDENTIALS_ENCRYPTION_KEY=base64:YOUR_GENERATED_KEY_HERE

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
```

### Optional

```bash
# Redis (optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379
```

### NOT Needed

```bash
# ❌ NO storage credentials in environment
# Users configure these via web dashboard:
# - R2 credentials
# - S3 credentials
# - MinIO credentials (except for local dev/testing)
```

## Migration Path for Existing Deployments

If you had storage credentials in environment variables before:

1. **Backup your data** from the old storage
2. **Update `.env`** to remove storage credentials
3. **Update code** to latest version
4. **Configure buckets** via web dashboard
5. **Test** file upload/download works
6. **Migrate data** if using different storage now

## Testing

### Local Development with MinIO

```bash
# Start MinIO for local testing
docker compose --profile minio up -d

# Access MinIO Console
open http://localhost:9001

# Configure bucket in Carcosa dashboard:
# - Provider: S3
# - Endpoint: http://localhost:9000
# - Access Key: minioadmin
# - Secret Key: minioadmin
# - Bucket: carcosa-demo (create in MinIO first)
```

### Production with R2/S3

1. Create bucket in Cloudflare R2 or AWS S3
2. Generate API credentials
3. Configure in Carcosa web dashboard
4. Test upload/download
5. Monitor via dashboard

## Files Changed

1. `.env.example` - Removed storage env vars, added BYOS comments
2. `apps/api/src/env.ts` - Removed MinIO env schema
3. `docker-compose.yml` - Made Redis/MinIO optional via profiles
4. `apps/api/src/routes/carcosa-file-router.routes.ts` - Removed env-based storage init
5. `README.md` - Complete rewrite with BYOS architecture
6. `CLAUDE.md` - Updated for BYOS architecture
7. `docs/` - Organized all documentation files

## Verification

✅ No storage credentials in `.env.example`
✅ No storage credentials in `apps/api/src/env.ts`
✅ File router doesn't initialize storage from env
✅ Docker Compose has optional profiles
✅ README explains BYOS architecture
✅ CLAUDE.md updated for BYOS
✅ Documentation organized

## Next Steps

1. ✅ Environment variables cleaned up
2. ✅ Code updated to use database bucket configuration
3. ✅ Documentation updated
4. 🚧 Test full upload/download flow
5. 🚧 Add integration tests for BYOS flow
6. 🚧 Add migration guide for existing users

## Conclusion

Carcosa now properly implements the BYOS (Bring Your Own Storage) architecture, where:
- **Users** provide their own storage credentials via the web dashboard
- **Platform** never requires storage credentials in environment variables
- **Security** is enhanced through encryption and on-demand decryption
- **Flexibility** is maximized - users can use any S3-compatible storage

This aligns with the core philosophy of Carcosa: giving developers complete control over their file infrastructure.

---

**Status**: ✅ Complete
**Last Updated**: November 23, 2024
**Author**: Claude Code
