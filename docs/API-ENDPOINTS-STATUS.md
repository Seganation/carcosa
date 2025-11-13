# Carcosa API Endpoints Status

**Last Updated**: November 13, 2025 (Session 4)
**API Version**: v1
**Base URL**: `http://localhost:4000` (development)

---

## 🎯 Overall API Status

**Build Status**: ✅ **PASSING** (0 TypeScript errors)
**Authentication**: ✅ **COMPLETE** (JWT + API Keys)
**Endpoints**: 75+ endpoints implemented
**Documentation**: This file + code comments

---

## 📚 API Endpoint Categories

### 1. Authentication Endpoints ✅ **COMPLETE**

All auth endpoints implemented and functional.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| POST | `/auth/register` | No | ✅ Ready | Register new user with email/password |
| POST | `/auth/login` | No | ✅ Ready | Login and receive JWT token |
| POST | `/auth/logout` | No | ✅ Ready | Clear authentication cookie |
| GET | `/auth/me` | Yes (JWT) | ✅ Ready | Get current authenticated user |

**Security Features**:
- bcrypt password hashing (12 rounds)
- JWT tokens (7-day expiration)
- HTTP-only cookies
- Bearer token support
- Input validation with Zod

---

### 2. Organizations Endpoints ✅ **READY**

Organization and team management.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| POST | `/organizations` | Yes | ✅ Ready | Create new organization |
| GET | `/organizations` | Yes | ✅ Ready | List user's organizations |
| GET | `/organizations/:id` | Yes | ✅ Ready | Get organization details |
| POST | `/organizations/:id/teams` | Yes | ✅ Ready | Create team in organization |
| GET | `/teams` | Yes | ✅ Ready | List user's teams |
| GET | `/teams/:id` | Yes | ✅ Ready | Get team details |
| POST | `/invite` | Yes | ✅ Ready | Invite user to organization/team |
| POST | `/invitations/:id/accept` | Yes | ✅ Ready | Accept invitation |
| GET | `/invitations` | Yes | ✅ Ready | List pending invitations |

**Features**:
- 3-tier hierarchy: Organization → Team → Project
- Role-based access (OWNER, ADMIN, MEMBER, VIEWER)
- Team invitation system

---

### 3. Projects Endpoints ✅ **READY**

Project/app management within teams.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects` | Yes | ✅ Ready | List all projects |
| GET | `/projects/teams/:teamId` | Yes | ✅ Ready | List team's projects |
| GET | `/projects/:id` | Yes | ✅ Ready | Get project details |
| POST | `/projects` | Yes | ✅ Ready | Create new project |
| PUT | `/projects/:id` | Yes | ✅ Ready | Update project |
| DELETE | `/projects/:id` | Yes | ✅ Ready | Delete project |
| GET | `/teams/:teamId/projects` | Yes | ✅ Ready | List team projects (alias) |
| GET | `/teams/:teamId/tenants` | Yes | ✅ Ready | Get team tenants |
| GET | `/teams/:teamId/transforms` | Yes | ✅ Ready | Get team transforms |
| GET | `/teams/:teamId/usage` | Yes | ✅ Ready | Get team usage stats |
| GET | `/teams/:teamId/audit-logs` | Yes | ✅ Ready | Get team audit logs |

---

### 4. Buckets Endpoints ✅ **READY**

Storage bucket management (S3/R2).

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/buckets` | Yes | ✅ Ready | List user's buckets |
| GET | `/buckets/:id` | Yes | ✅ Ready | Get bucket details |
| POST | `/buckets` | Yes | ✅ Ready | Create new bucket |
| DELETE | `/buckets/:id` | Yes | ✅ Ready | Delete bucket |
| POST | `/buckets/:bucketId/access` | Yes | ✅ Ready | Grant team access to bucket |
| DELETE | `/buckets/:bucketId/access/:teamId` | Yes | ✅ Ready | Revoke team access |
| GET | `/buckets/:bucketId/available-teams` | Yes | ✅ Ready | Get teams that can access bucket |
| GET | `/teams/:teamId/buckets` | Yes | ✅ Ready | Get team's accessible buckets |

**Features**:
- S3 and Cloudflare R2 support
- Encrypted credentials (libsodium)
- Team-based bucket sharing
- Granular permissions (READ_ONLY, READ_WRITE, ADMIN)

---

### 5. Files Endpoints ✅ **READY**

File listing and management.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects/:id/files` | Yes | ✅ Ready | List project files |
| GET | `/projects/:id/files/:fileId/download` | Yes | ✅ Ready | Download file |
| DELETE | `/projects/:id/files` | Yes | ✅ Ready | Delete files (batch) |

---

### 6. Uploads Endpoints ✅ **READY**

File upload endpoints (API key auth).

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| POST | `/projects/:id/uploads/init` | API Key | ✅ Ready | Initialize upload, get signed URL |
| POST | `/projects/:id/uploads/upload` | API Key | ✅ Ready | Proxy upload through API |
| POST | `/projects/:id/uploads/confirm` | API Key | ✅ Ready | Confirm upload completion |
| GET | `/projects/:id/uploads` | API Key | ✅ Ready | List uploads |

**Features**:
- Signed URL generation for direct uploads
- Proxy upload support
- Multi-part upload support
- Progress tracking ready

---

### 7. Tenants Endpoints ✅ **READY**

Multi-tenant client management.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects/:id/tenants` | Yes | ✅ Ready | List project tenants |
| POST | `/projects/:id/tenants` | Yes | ✅ Ready | Create tenant |
| PUT | `/projects/:id/tenants/:tenantId` | Yes | ✅ Ready | Update tenant |
| DELETE | `/projects/:id/tenants/:tenantId` | Yes | ✅ Ready | Delete tenant |

**Features**:
- Isolated storage per tenant
- Structured file paths: `/{org}/{team}/{project}/{tenant}/{file}`

---

### 8. Transform Endpoints ✅ **READY**

Image transformation and processing.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/api/v:version/transform/:projectId/*` | No | ✅ Ready | Transform image on-demand |
| GET | `/projects/:id/transforms` | Yes | ✅ Ready | List project transforms |
| GET | `/projects/:id/transforms/stats` | Yes | ✅ Ready | Get transform statistics |
| POST | `/projects/:id/transforms/:id/retry` | Yes | ✅ Ready | Retry failed transform |
| DELETE | `/projects/:id/transforms/:id` | Yes | ✅ Ready | Delete transform record |

**Transform Parameters**:
- `w` - Width
- `h` - Height
- `format` - Output format (webp, jpeg, png, avif)
- `fit` - Resize mode (cover, contain, fill, inside, outside)
- `quality` - Compression quality (1-100)

**Powered by**: Sharp (fast Node.js image processing)

**⚠️ TODO**: Implement Redis caching for transforms (Week 2)

---

### 9. API Keys Endpoints ✅ **READY**

Project-scoped API key management.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects/:id/api-keys` | Yes | ✅ Ready | List project API keys |
| POST | `/projects/:id/api-keys` | Yes | ✅ Ready | Create new API key |
| PUT | `/projects/:id/api-keys/:keyId` | Yes | ✅ Ready | Update API key |
| DELETE | `/projects/:id/api-keys/:keyId` | Yes | ✅ Ready | Revoke API key |
| POST | `/projects/:id/api-keys/:keyId/regenerate` | Yes | ✅ Ready | Regenerate API key |

**Alternative Endpoints** (older):
| GET | `/api/v1/projects/:id/keys` | Yes | ✅ Ready | List keys (alias) |
| POST | `/api/v1/projects/:id/keys` | Yes | ✅ Ready | Create key (alias) |
| POST | `/api/v1/projects/:id/keys/:keyId/revoke` | Yes | ✅ Ready | Revoke key (alias) |

**Features**:
- SHA-256 hashed keys
- Prefix: `carc_`
- Permissions array (currently basic)
- Last used tracking
- Revocation support

---

### 10. Audit Logs Endpoints ✅ **READY**

Activity tracking and compliance.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects/:id/audit-logs` | Yes | ✅ Ready | Get project audit logs |
| GET | `/users/:id/audit-logs` | Yes | ✅ Ready | Get user audit logs |
| GET | `/audit-logs` | Yes | ✅ Ready | Get all audit logs (admin) |
| GET | `/projects/:id/audit-logs/export` | Yes | ✅ Ready | Export audit logs (CSV/JSON) |

**Tracked Events**:
- File uploads/downloads/deletes
- User authentication
- API key usage
- Settings changes
- Team/organization changes

---

### 11. Usage & Analytics Endpoints ✅ **READY**

Usage tracking and analytics.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/projects/:id/usage` | Yes | ✅ Ready | Get project usage stats |

**Metrics Tracked**:
- Storage used
- Bandwidth consumed
- Transform count
- API requests
- File count

**⚠️ TODO**: Implement detailed analytics dashboard (Week 2)

---

### 12. Rate Limiting Endpoints ✅ **READY**

Per-project rate limit configuration.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/api/v1/projects/:id/rate_limit` | Yes | ✅ Ready | Get rate limit config |
| POST | `/api/v1/projects/:id/rate_limit` | Yes | ✅ Ready | Update rate limit config |

**Features**:
- Redis-based rate limiting (if Redis available)
- Fallback to Postgres
- Configurable limits per project
- Token bucket algorithm

---

### 13. Settings Endpoints ✅ **READY**

Project settings management.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/api/v1/projects/:id/settings` | Yes | ✅ Ready | Get project settings |
| POST | `/api/v1/projects/:id/settings` | Yes | ✅ Ready | Update project settings |
| POST | `/api/v1/projects/:id/regenerate-key` | Yes | ✅ Ready | Regenerate project API key |

---

### 14. Carcosa File-Router Endpoints ⏸️ **TEMPORARILY DISABLED**

Advanced file upload system (UploadThing-style).

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| POST | `/carcosa/init` | Yes | ⏸️ Disabled | Initialize file-router upload |
| POST | `/carcosa/complete` | Yes | ⏸️ Disabled | Complete file-router upload |
| GET | `/carcosa/realtime` | No | ⏸️ Disabled | WebSocket for progress |
| GET | `/carcosa/files/*` | No | ⏸️ Disabled | Serve uploaded files |
| GET | `/carcosa/health` | No | ⏸️ Disabled | Health check |

**Status**: Temporarily disabled for API compatibility fixes
**Re-enable**: Week 2 after testing
**Features**: Type-safe routes, real-time progress, middleware system

---

### 15. Carcosa Uploads Endpoints 🔄 **TESTING**

Alternative upload system.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|---------------|--------|-------------|
| GET | `/health` | No | ✅ Ready | API health check |
| POST | `/images` | API Key | 🔄 Testing | Upload image |
| POST | `/documents` | API Key | 🔄 Testing | Upload document |
| POST | `/videos` | API Key | 🔄 Testing | Upload video |
| POST | `/init` | API Key | 🔄 Testing | Initialize upload |
| POST | `/complete` | API Key | 🔄 Testing | Complete upload |
| GET | `/status/:uploadId` | API Key | 🔄 Testing | Get upload status |

**Status**: Basic implementation, needs E2E testing

---

## 🔐 Authentication Methods

### 1. JWT Token (User Authentication)

**Usage**: Frontend applications, user sessions

```bash
# Login to get token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in subsequent requests
curl http://localhost:4000/projects \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Or with cookie (set automatically)
curl http://localhost:4000/projects \
  -b cookies.txt
```

### 2. API Key (Programmatic Access)

**Usage**: Server-to-server, SDK, CLI

```bash
# Use API key in header
curl http://localhost:4000/projects/PROJECT_ID/uploads/init \
  -H "Authorization: Bearer carc_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","fileSize":12345,"contentType":"image/jpeg"}'
```

**API Key Format**: `carc_<base64url_random_32_bytes>`

---

## 🧪 Testing Endpoints

### Quick Health Check

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test Authentication

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# Get current user
curl http://localhost:4000/auth/me -b cookies.txt
```

### Test Project Creation

```bash
# Create organization first
curl -X POST http://localhost:4000/organizations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Organization",
    "slug": "my-org"
  }'

# Create team
curl -X POST http://localhost:4000/organizations/ORG_ID/teams \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "slug": "my-team"
  }'

# Create project
curl -X POST http://localhost:4000/projects \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "teamId": "TEAM_ID"
  }'
```

---

## 📊 API Endpoint Summary

| Category | Total | Ready | Testing | Disabled |
|----------|-------|-------|---------|----------|
| Authentication | 4 | 4 | 0 | 0 |
| Organizations | 9 | 9 | 0 | 0 |
| Projects | 11 | 11 | 0 | 0 |
| Buckets | 8 | 8 | 0 | 0 |
| Files | 3 | 3 | 0 | 0 |
| Uploads | 4 | 4 | 0 | 0 |
| Tenants | 4 | 4 | 0 | 0 |
| Transforms | 5 | 5 | 0 | 0 |
| API Keys | 9 | 9 | 0 | 0 |
| Audit Logs | 4 | 4 | 0 | 0 |
| Usage | 1 | 1 | 0 | 0 |
| Rate Limiting | 2 | 2 | 0 | 0 |
| Settings | 3 | 3 | 0 | 0 |
| File-Router | 5 | 0 | 0 | 5 |
| Carcosa Uploads | 7 | 1 | 6 | 0 |
| **TOTAL** | **79** | **68** | **6** | **5** |

**Overall API Readiness**: **86% Ready** (68/79 endpoints)

---

## 🚧 Known Issues & Limitations

### Critical
- ⚠️ File-router routes disabled (API compatibility - re-enable Week 2)
- ⚠️ E2E upload testing requires Docker environment
- ⚠️ Transform caching not implemented (performance impact)

### Important
- ⚠️ WebSocket realtime system disabled
- ⚠️ No comprehensive error handling tests
- ⚠️ API key permissions are basic (not granular)
- ⚠️ Rate limiting not optimized

### Nice to Have
- ⚠️ OpenAPI/Swagger documentation pending
- ⚠️ API versioning strategy needs refinement
- ⚠️ Webhook system incomplete
- ⚠️ No video processing (FFmpeg) yet

---

## 📅 Week 2 Priorities

Based on this API audit, Week 2 should focus on:

1. **Re-enable File-Router** - Fix API compatibility and test
2. **Transform Caching** - Implement Redis caching for performance
3. **E2E Testing** - Set up Docker and test upload flow
4. **Error Handling** - Add comprehensive error responses
5. **Documentation** - Generate OpenAPI spec
6. **Frontend Integration** - Wire dashboard to endpoints

---

## 📝 Notes

- All endpoints require proper auth middleware (JWT or API key)
- Error responses follow consistent format: `{error: "code", details?: any}`
- Success responses are context-specific
- Pagination not yet implemented (TODO for large datasets)
- CORS configured for localhost:3000 (development)

---

**Last Updated**: Session 4, November 13, 2025
**Next Review**: After local E2E testing
