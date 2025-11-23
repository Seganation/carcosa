# Carcosa API - CRUD Operations Analysis

## Overview
This report analyzes all controllers in `/apps/api/src/controllers/` and identifies existing and missing CRUD operations for each resource based on the Prisma schema.

---

## 1. ORGANIZATIONS

### Existing Endpoints (C: ✓, R: ✓, U: ✗, D: ✗)
- **CREATE**: `POST /organizations` → `createOrganization()`
  - Creates new organization with name, slug, description, logo
  - Auto-creates owner as OWNER role
  
- **READ**: 
  - `GET /organizations/:id` → `getOrganization()` - Get by ID
  - `GET /organizations` → `listUserOrganizations()` - List user's organizations
  
- **UPDATE**: ✗ Missing
- **DELETE**: ✗ Missing

### Additional Endpoints
- `POST /organizations/init-workspace` → `initializeWorkspace()` - Auto-setup for legacy users
- `POST /organizations/:organizationId/teams` → Team creation (nested under org)

### Missing Operations
- **UPDATE Organization**: No endpoint to update organization name, slug, description, logo
- **DELETE Organization**: No endpoint to delete organization (with cascading effects)
- **LIST Organization Members**: No dedicated endpoint (members exist in model)
- **INVITE Organization Members**: Invites exist at org level
- **REMOVE Organization Members**: No endpoint to remove members
- **UPDATE Organization Member Role**: No endpoint to change member roles
- **GET Organization Audit Logs**: Team-scoped audit logs exist, but org-level logs missing

---

## 2. TEAMS

### Existing Endpoints (C: ✓, R: ✓, U: ✗, D: ✗)
- **CREATE**: `POST /organizations/:organizationId/teams` → `createTeam()`
  - Creates team within organization
  
- **READ**:
  - `GET /teams/:id` → `getTeam()` - Get by ID
  - `GET /teams` → `listUserTeams()` - List user's teams
  
- **UPDATE**: ✗ Missing
- **DELETE**: ✗ Missing

### Team Member Management (Related)
- **INVITE to Team**: `POST /organizations/invite` → `inviteUser()` - Can invite to team or org
- **LIST Pending Invitations**: `GET /invitations` → `listPendingInvitations()`
- **ACCEPT Invitation**: `POST /invitations/:invitationId/accept` → `acceptInvitation()`

### Team-Scoped Resources (Read-only aggregation)
- `GET /teams/:teamId/tenants` → `getTeamTenants()` - List tenants across projects
- `GET /teams/:teamId/transforms` → `getTeamTransforms()` - List transforms across projects
- `GET /teams/:teamId/usage` → `getTeamUsage()` - Aggregate usage data
- `GET /teams/:teamId/audit-logs` → `getTeamAuditLogs()` - Aggregate audit logs

### Missing Operations
- **UPDATE Team**: No endpoint to update team name, slug, description
- **DELETE Team**: No endpoint to delete team
- **LIST Team Members**: No dedicated endpoint for team members
- **REMOVE Team Member**: No endpoint to remove member from team
- **UPDATE Team Member Role**: No endpoint to change member roles
- **REVOKE Team Invitation**: No endpoint to revoke pending invitations
- **DECLINE Invitation**: No endpoint for invitee to decline invitation

---

## 3. TEAM MEMBERS

### Existing Endpoints (C: ✓, R: ✗, U: ✗, D: ✗)
- **CREATE**: Implicit via `inviteUser()` + `acceptInvitation()` flow
  
### Missing Operations
- **READ Team Members**: No endpoint to list team members
- **READ Single Member**: No endpoint to get individual member details
- **UPDATE Member Role**: No endpoint to change member role (OWNER/ADMIN/MEMBER/VIEWER)
- **DELETE Member**: No endpoint to remove member from team
- **LIST Organization Members**: No endpoint for organization-level member list
- **UPDATE Organization Member Role**: No endpoint to change org member roles

---

## 4. PROJECTS

### Existing Endpoints (C: ✓, R: ✓, U: ✓, D: ✓)
- **CREATE**: `POST /projects` → `create()`
  - Creates project with bucket, slug, optional team
  
- **READ**:
  - `GET /projects/:id` → `get()` - Get by ID
  - `GET /projects` → `list()` - List user's projects
  - `GET /teams/:teamId/projects` → `listByTeam()` - List team's projects
  
- **UPDATE**: `PATCH /projects/:id` → `update()`
  - Updates project name, slug, bucket
  
- **DELETE**: `DELETE /projects/:id` → `deleteProject()`

### Additional Endpoints
- `POST /projects/:id/validate-credentials` → `validateCredentials()` - Test bucket connection
- `GET /projects/:id/settings` → `getProjectSettings()` (settings.controller)
- `PATCH /projects/:id/settings` → `updateProjectSettings()` (settings.controller)

### Missing Operations
- **ARCHIVE Project**: No endpoint to archive without deleting
- **RESTORE Project**: No endpoint to restore archived project
- **TRANSFER Project**: No endpoint to transfer project to different team
- **GET Project Settings Details**: Settings are partially implemented
- **DUPLICATE/CLONE Project**: No endpoint to clone with same configuration

---

## 5. BUCKETS

### Existing Endpoints (C: ✓, R: ✓, U: ✗, D: ✓)
- **CREATE**: `POST /buckets?teamId=X` → `create()`
  - Creates S3/R2 bucket with encrypted credentials
  
- **READ**:
  - `GET /buckets/:id` → `get()` - Get by ID
  - `GET /buckets` → `list()` - List accessible buckets
  - `GET /buckets/:id/team-buckets?teamId=X` → `getTeamBuckets()` - Get buckets accessible to team
  
- **UPDATE**: ✗ Missing
- **DELETE**: `DELETE /buckets/:id` → `deleteBucket()`
  - Can only delete if not in use by projects

### Bucket Sharing (BucketTeamAccess)
- `POST /buckets/:bucketId/share` → `grantTeamAccess()` - Share with team
- `DELETE /buckets/:bucketId/teams/:teamId` → `revokeTeamAccess()` - Revoke access
- `GET /buckets/:bucketId/available-teams` → `getAvailableTeams()` - List teams to share with
- `POST /buckets/:id/validate-credentials` → `validateCredentials()` - Test connection

### Missing Operations
- **UPDATE Bucket**: No endpoint to update bucket name or configuration
- **ROTATE Credentials**: No endpoint to rotate access keys/secrets
- **UPDATE Access Level**: No endpoint to change BucketTeamAccess permission level
- **LIST Bucket Access**: No endpoint to see which teams have access to a bucket
- **GET Bucket Usage**: No endpoint to see storage usage for a bucket
- **GET Bucket Health**: Connection status checked but not exposed as endpoint

---

## 6. PROJECTS → API KEYS (Token-based Authentication)

### Existing Endpoints (C: ✓, R: ✓, U: ✓, D: ✓)
- **CREATE**: `POST /projects/:id/api-keys` → `create()`
  - Creates API key with label and permissions (granular)
  
- **READ**:
  - `GET /projects/:id/api-keys` → `list()` - List project API keys
  
- **UPDATE**: `PATCH /projects/:id/api-keys/:keyId` → `update()`
  - Currently calls regenerate() - regenerates key with new permissions
  
- **DELETE**: `DELETE /projects/:id/api-keys/:keyId` → `revoke()`
  - Soft delete via revokedAt timestamp

### Additional Endpoints
- `POST /projects/:id/api-keys/:keyId/regenerate` → `regenerate()` - Get new key
- **Permission Groups**: Full support with validation schema

### Missing Operations
- **UPDATE Permissions Only**: Can't update permissions without regenerating key
- **GET Single API Key**: No endpoint to fetch single key details
- **ROTATE Key**: While regenerate exists, dedicated rotate endpoint would be clearer
- **LIST Access Logs**: No audit trail for API key usage

---

## 7. PROJECTS → TOKENS (Legacy or Secondary Auth?)

### Existing Endpoints (C: ✓, R: ✓, D: ✓, U: ✗)
- **CREATE**: `POST /projects/:id/tokens` → `create()`
  
- **READ**: `GET /projects/:id/tokens` → `list()`
  
- **DELETE**: `POST /projects/:id/tokens/:keyId/revoke` → `revoke()`

### Missing Operations
- **UPDATE Token**: No update endpoint
- **GET Single Token**: No individual token fetch
- **Difference from API Keys**: Schema indicates separate Token model - purpose unclear

---

## 8. FILES

### Existing Endpoints (C: ✗, R: ✓, D: ✓, U: ✗)
- **CREATE**: ✗ Missing (files created via upload flow)
  
- **READ**:
  - `GET /projects/:id/files` → `list()` - List files with pagination, tenant/version filtering
  - `GET /projects/:id/files/:fileId/download` → `download()` - Get signed download URL
  
- **UPDATE**: ✗ Missing
- **DELETE**: `DELETE /projects/:id/files` → `del()` - Batch delete via array of file IDs

### Missing Operations
- **UPDATE File Metadata**: No endpoint to update file metadata
- **GET Single File Details**: No individual file fetch endpoint
- **RENAME File**: No endpoint to rename files
- **MOVE/COPY File**: No file movement operations
- **GET File Versions**: Files support versioning but no endpoint to list versions
- **RESTORE Previous Version**: No version restoration
- **GET File Access Logs**: No access audit trail

---

## 9. TENANTS (Multi-tenancy)

### Existing Endpoints (C: ✓, R: ✓, U: ✓, D: ✓)
- **CREATE**: `POST /projects/:id/tenants` → `create()`
  
- **READ**: `GET /projects/:id/tenants` → `list()`
  
- **UPDATE**: `PATCH /projects/:id/tenants/:tenantId` → `update()`
  
- **DELETE**: `DELETE /projects/:id/tenants/:tenantId` → `del()`

### Missing Operations
- **GET Single Tenant**: No individual tenant fetch (only list)
- **GET Tenant Metadata**: Metadata stored but no dedicated endpoint
- **LIST Tenant Files**: No endpoint to list files for specific tenant
- **GET Tenant Usage**: Usage data exists but no dedicated endpoint

---

## 10. TRANSFORMS (Image/Media Transformation)

### Existing Endpoints (C: ✗, R: ✓, D: ✓, U: ✗)
- **CREATE**: `GET /api/v{n}/transform/:projectId/*path?w=&h=&q=&f=` → `handle()`
  - On-demand transform execution (read but creates record)
  
- **READ**:
  - `GET /projects/:id/transforms` → `getProjectTransforms()` - List with pagination
  - `GET /projects/:id/transforms/stats` → `getTransformStats()` - Statistics by status
  - `GET /transform-cache-stats` → `getCacheStats()` - Redis cache metrics
  
- **UPDATE**: `POST /projects/:id/transforms/:transformId/retry` → `retryTransform()`
  - Resets failed transform to pending
  
- **DELETE**: `DELETE /projects/:id/transforms/:transformId` → `deleteTransform()`

### Missing Operations
- **GET Single Transform**: No individual transform details endpoint
- **CREATE Transform (explicit)**: Only on-demand via handle()
- **UPDATE Transform Settings**: Can't modify transform options after creation
- **PAUSE Transform**: No pause capability
- **BULK RETRY**: No bulk retry for multiple failed transforms
- **CUSTOM PRESETS**: No endpoint to manage transform presets

---

## 11. UPLOADS (Upload Management)

### Existing Endpoints (C: ✓, R: ✓, D: ✗, U: ✗)
- **CREATE**: `POST /uploads/init` → `initUpload()`
  - Get presigned URLs for chunked/direct upload
  
- **READ**:
  - `GET /uploads/list` → `listUploads()` - List project uploads
  
- **UPDATE**: `POST /uploads/confirm` → `confirmUpload()`
  - Marks upload complete and creates file record
  
- **DELETE**: ✗ Missing

### Additional Endpoints
- `POST /uploads/proxy` → `proxyUpload()` - Server-side upload proxy

### Missing Operations
- **DELETE Upload**: No endpoint to cancel/delete incomplete uploads
- **GET Single Upload**: No individual upload details
- **PAUSE/RESUME**: No pause capability
- **GET Upload Progress**: No real-time progress endpoint (WebSocket may exist)

---

## 12. AUDIT LOGS (Read-only)

### Existing Endpoints (R: ✓)
- **READ**:
  - `GET /projects/:id/audit-logs` → `getProjectAuditLogs()` - With filtering & pagination
  - `GET /users/:userId/audit-logs` → `getUserAuditLogs()` - User activity
  - `GET /audit-logs` → `getAllAuditLogs()` - Admin view with filtering
  - `GET /projects/:id/audit-logs/export` → `exportAuditLogs()` - CSV export

### Audit Log Utility
- `createAuditLog()` - Helper function for logging (internal use)

### Missing Operations
- **CREATE (manual)**: Only created automatically by system actions
- **UPDATE**: Audit logs are immutable
- **DELETE**: No deletion capability (compliance requirement)
- **PURGE Old Logs**: No endpoint to archive/purge old logs
- **GET Audit Log by ID**: No individual log fetch
- **FILTER by Multiple Criteria**: Limited to action, resource, userId

---

## 13. USAGE (Analytics/Tracking)

### Existing Endpoints (R: ✓)
- **READ**:
  - `GET /projects/:id/usage/daily` → `dailyForProject()` - Daily usage with range filter (7d/30d/90d)
  - `GET /projects/:id/usage/tenant` → `getProjectUsageByTenant()` - Breakdown by tenant

### Usage Utility
- `recordUsage()` - Internal function to log usage metrics

### Missing Operations
- **CREATE**: Only recorded automatically
- **UPDATE**: Usage data is immutable
- **DELETE**: No deletion capability
- **GET Monthly/Yearly**: Only daily granularity
- **GET Usage Forecast**: No predictive analytics
- **GET Cost Estimate**: No cost calculation endpoint
- **GET Bandwidth Usage**: Tracked but not exposed in dedicated endpoint
- **GET Top Resources**: No ranking of top files/tenants by usage

---

## 14. RATE LIMITING Configuration

### Existing Endpoints (R: ✓, U: ✓)
- **CREATE**: Implicit via `upsert()`
  
- **READ**:
  - `GET /projects/:id/rate-limit` → `getConfig()` - Get project rate limits
  - `GET /rate-limit/stats` → `getStats()` - In-memory limiter statistics
  
- **UPDATE**: `POST /projects/:id/rate-limit` → `upsert()` - Create or update
  - Sets uploadsPerMinute, transformsPerMinute, bandwidthPerMonthMiB
  
- **DELETE**: ✗ Missing (reset via routes)

### Admin Endpoints
- `POST /rate-limit/reset` → `resetLimit()` - Reset specific key
- `POST /rate-limit/reset-all` → `resetAllLimits()` - Clear all limits

### Missing Operations
- **DELETE Config**: No endpoint to remove rate limit (reset to defaults)
- **GET Historical Stats**: Only current stats available
- **GET Top Violators**: No list of projects exceeding limits
- **BULK UPDATE**: No batch rate limit updates

---

## 15. AUTHENTICATION (Auth Flow)

### Existing Endpoints (C: ✓, R: ✓, D: ✓)
- **REGISTER**: `POST /auth/register` → `register()`
  - Auto-creates default organization and team
  
- **READ**: `GET /auth/me` → `me()`
  - Get current user from JWT/cookie
  
- **LOGIN**: `POST /auth/login` → `login()`
  - Email/password authentication with JWT + cookie
  
- **LOGOUT**: `POST /auth/logout` → `logout()`
  - Clear cookie

### Missing Operations
- **UPDATE Profile**: No endpoint to update user name/email
- **CHANGE Password**: No password change endpoint
- **FORGOT/RESET Password**: No password recovery flow
- **EMAIL Verification**: No email verification endpoint
- **TWO-FACTOR Auth**: Not implemented
- **REFRESH Token**: JWT doesn't appear to have refresh mechanism
- **GET User Profile**: Only current user via /me

---

## 16. PROJECT SETTINGS (Unified Settings)

### Existing Endpoints (R: ✓, U: ✓)
- **READ**: `GET /projects/:id/settings` → `getProjectSettings()`
  - Returns default/hardcoded settings
  
- **UPDATE**: `PATCH /projects/:id/settings` → `updateProjectSettings()`
  - Validates but doesn't persist (TODO comment)

### Additional
- `POST /projects/:id/settings/regenerate-key` → `regenerateApiKey()`
  - Revokes old keys and creates new one

### Missing Operations
- **Settings Persistence**: Currently returning hardcoded defaults
- **GET Settings Schema**: No endpoint for available settings
- **RESET to Defaults**: No reset endpoint
- **GET Settings History**: No version history for settings changes

---

## 17. VERSIONS (File Versioning)

### Existing Endpoints (R: ✗, C: ✗, U: ✗, D: ✗)
- Schema exists (Version model) but **NO CONTROLLERS**
- Files reference version "v1" by default
- Version functionality mentioned in projects but not exposed

### Missing Operations (Entire Resource)
- **CREATE Version**: No endpoint
- **READ Versions**: No list/get endpoints
- **UPDATE Version**: No update endpoint
- **DELETE Version**: No deletion endpoint
- **ACTIVATE Version**: No endpoint to switch active version
- **GET Version Comparison**: No diff functionality

---

## 18. INVITATIONS (Already Covered Under Organizations)

### Existing Endpoints (C: ✓, R: ✓, U: ✓, D: ✗)
- **CREATE**: `POST /organizations/invite` → `inviteUser()`
  - Can invite at org or team level
  
- **READ**: `GET /invitations` → `listPendingInvitations()`
  
- **UPDATE**: `POST /invitations/:invitationId/accept` → `acceptInvitation()`
  
- **DELETE**: ✗ Missing (no revoke endpoint)

### Missing Operations
- **REVOKE Invitation**: No endpoint to cancel pending invitation
- **RESEND Invitation**: No endpoint to resend invitation email
- **DECLINE Invitation**: No endpoint for invitee to decline
- **LIST All Invitations**: Only current user's pending invitations

---

## 19. CARCOSA UPLOADS (File Router Integration - Stub)

### Existing Endpoints (Health Check Only)
- `POST /carcosa/images` → `handleImageUpload()` - Stub
- `POST /carcosa/documents` → `handleDocumentUpload()` - Stub
- `POST /carcosa/videos` → `handleVideoUpload()` - Stub
- `POST /carcosa/init` → `initCarcosaUpload()` - Stub
- `POST /carcosa/complete` → `completeCarcosaUpload()` - Stub
- `GET /carcosa/health` → `carcosaHealth()` - Status only

### Status: **Placeholder/TODO**
- All handlers return success responses but don't implement actual file-router integration
- No actual file processing or storage

---

## Summary Table

| Resource | C | R | U | D | Notes |
|----------|---|---|---|---|-------|
| Organizations | ✓ | ✓ | ✗ | ✗ | Can't update or delete |
| Teams | ✓ | ✓ | ✗ | ✗ | Can't update or delete |
| Team Members | ✓ | ✗ | ✗ | ✗ | Created via invite only, no direct management |
| Org Members | ✗ | ✗ | ✗ | ✗ | No endpoints (role exists in model) |
| Projects | ✓ | ✓ | ✓ | ✓ | Full CRUD |
| Buckets | ✓ | ✓ | ✗ | ✓ | Can't update config |
| API Keys | ✓ | ✓ | ✓ | ✓ | Full CRUD (update = regenerate) |
| Tokens | ✓ | ✓ | ✗ | ✓ | No update, purpose unclear |
| Files | ✗ | ✓ | ✗ | ✓ | Created via upload, can't update |
| Tenants | ✓ | ✓ | ✓ | ✓ | Full CRUD |
| Transforms | ✗ | ✓ | ✓ | ✓ | Created on-demand, can retry/delete |
| Uploads | ✓ | ✓ | ✓ | ✗ | Can't cancel |
| Audit Logs | ✗ | ✓ | ✗ | ✗ | Read-only, immutable |
| Usage | ✗ | ✓ | ✗ | ✗ | Read-only, auto-recorded |
| Rate Limits | ✓ | ✓ | ✓ | ✗ | Can upsert, no delete |
| Versions | ✗ | ✗ | ✗ | ✗ | No endpoints (schema only) |
| Invitations | ✓ | ✓ | ✓ | ✗ | Can't revoke pending |
| Auth/Users | ✗ | ✓ | ✗ | ✗ | No user profile update |
| Settings | ✗ | ✓ | ✓ | ✗ | Settings not persisted (TODO) |

---

## Priority Gaps (High Impact Missing Features)

### Tier 1 - Critical
1. **Organization Management**: UPDATE/DELETE organizations
2. **Team Management**: UPDATE/DELETE teams, member management
3. **Bucket Updates**: Update configuration, rotate credentials
4. **User Profile**: Update user name/email, password management
5. **File Management**: Update metadata, rename files
6. **Settings Persistence**: Actually save and retrieve project settings

### Tier 2 - Important
7. **Invitation Management**: Revoke, resend, decline invitations
8. **Version Management**: Full CRUD for versioning system
9. **Member Roles**: Update team/org member roles
10. **Upload Cancellation**: Cancel in-progress uploads
11. **API Key Logging**: Track API key usage/access

### Tier 3 - Enhancement
12. **Batch Operations**: Bulk updates, bulk deletes
13. **Archive/Restore**: Project archival without deletion
14. **Usage Analytics**: Monthly/yearly views, forecasting
15. **Transform Presets**: Save/manage transform configurations
16. **Two-Factor Authentication**: Enhanced security

