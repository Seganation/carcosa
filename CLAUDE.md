# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carcosa is a developer-first, storage-agnostic media control plane for uploads, transforms, and multi-tenancy. It's built as a self-hosted alternative to services like UploadThing, giving developers complete control over their storage infrastructure (Cloudflare R2 or AWS S3).

This is a TypeScript monorepo using:
- **Turbo** for build orchestration
- **npm workspaces** for package management
- **Prisma** for database ORM (PostgreSQL)
- **Express** for the API server
- **Next.js** (App Router) for the web dashboard

## Common Commands

### Development

```bash
# Start local infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# Install dependencies
npm install

# Build all packages
npm run build

# Run all apps in dev mode
npm run dev

# Lint all packages
npm run lint

# Type-check all packages
npm run check-types
```

### Database

The database package (`@carcosa/database`) contains the Prisma schema and all database operations:

```bash
# Generate Prisma client (run after schema changes)
npm run --workspace @carcosa/database db:generate

# Push schema changes to database (dev only)
npm run --workspace @carcosa/database db:push

# Create a migration
npm run --workspace @carcosa/database db:migrate

# Deploy migrations (production)
npm run --workspace @carcosa/database db:deploy

# Seed the database with demo data
npm run --workspace @carcosa/database db:seed
```

### Workspace Commands

Run commands in specific workspaces:

```bash
# Run API in dev mode
npm run --workspace api dev

# Build the web app
npm run --workspace web build

# Run a package's specific script
npm run --workspace @carcosa/sdk build
```

## Architecture

### 3-Tier Ownership Model (Organization → Team → Project)

Carcosa implements a hierarchical multi-tenancy model similar to GitHub, Vercel, and other SaaS platforms:

1. **Organization Level**: Owns infrastructure (buckets, credentials), billing, audit logs, usage analytics
2. **Team Level**: Owns projects/apps, manages collaborators, shares bucket access
3. **Project Level**: Individual applications with API keys, files, tenants, transforms

**Key Concepts:**
- **Buckets** are owned by teams but can be shared with other teams via `BucketTeamAccess` with granular permissions (READ_ONLY, READ_WRITE, ADMIN)
- **File isolation** is achieved through structured paths: `/{organizationSlug}/{teamSlug}/{projectSlug}/{filename}`
- **Projects** belong to teams and use buckets their team has access to
- **Tenants** are multi-tenant sub-clients scoped to specific projects (e.g., different customer workspaces)

### Monorepo Structure

```
apps/
  api/           - Express API server with Sharp transforms, Prisma, Redis rate limiting
  web/carcosa/   - Next.js dashboard with NextAuth
  web/test/      - Test application
  docs/          - Documentation site

packages/
  database/      - Prisma schema and client (shared database layer)
  storage/       - S3/R2 storage adapters
  types/         - Shared TypeScript types
  sdk/           - Client SDK for uploads/transforms
  cmage/         - React image component with automatic transforms
  cli/           - CLI tool for uploads and management
  file-router/   - Type-safe upload router (UploadThing-style API)
  nextjs/        - Next.js integration utilities
  prisma-adapter/- Prisma adapter for NextAuth
  ui/            - Shared UI components
  eslint-config/ - Shared ESLint configuration
  typescript-config/ - Shared TypeScript configuration
```

### API Structure

The API (`apps/api/src`) follows a layered architecture:

```
routes/         - Express route definitions (thin layer)
controllers/    - Request/response handling, validation
services/       - Business logic, database operations
middlewares/    - Auth, rate limiting, error handling
utils/          - Crypto, file paths, serialization
validations/    - Zod schemas for request validation
```

**Key Services:**
- `storage.service.ts` - Abstracts S3/R2 operations, decrypts bucket credentials
- `uploads.service.ts` - Handles upload initialization and completion
- `files.service.ts` - File listing, deletion, metadata
- `buckets.service.ts` - Bucket management and team sharing
- `tokens.service.ts` - API key generation and validation

### File Router System

The `@carcosa/file-router` package provides a type-safe, middleware-driven upload system inspired by UploadThing:

```typescript
// Define typed routes with middleware and callbacks
uploadRouter.addRoute(
  'profileImage',
  f.imageUploader({ maxFileSize: '2MB' })
    .middleware(async ({ req }) => {
      // Auth logic
      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Post-upload processing
    })
);
```

**Features:**
- Type-safe routes with full TypeScript inference
- Middleware support for auth/validation
- Real-time upload progress via WebSocket
- Storage abstraction (S3, R2, local)
- Framework agnostic (Express, Next.js, etc.)

### Storage Architecture

Storage adapters (`packages/storage/src`) provide a unified interface for S3-compatible storage:

```typescript
interface StorageAdapter {
  getSignedPutUrl(key: string, metadata): Promise<SignedUrl>;
  putObject(key: string, buffer: Buffer): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  listObjects(prefix: string): Promise<ObjectInfo[]>;
}
```

**Credential Security:**
- Bucket credentials (access/secret keys) are encrypted at rest using libsodium
- Decryption happens only in the backend on-demand (`apps/api/src/utils/crypto.ts`)
- Encryption key is stored in `ENCRYPTION_KEY` environment variable

### Transform Pipeline

Image transforms are handled on-demand using Sharp:
- Transform endpoint: `GET /api/v{n}/transform/:projectId/*path`
- Query params: `?w=800&h=600&format=webp&fit=cover&quality=80`
- Caching headers sent to enable CDN/edge caching
- Optional Cloudflare Worker template in `templates/cloudflare-worker/` for edge caching

### Real-time System

The file-router package includes a WebSocket-based real-time system for upload progress:
- Powered by Redis pub/sub or in-memory fallback
- Integrated into the Express server via `realtimeSystem.attach(server)` in `apps/api/src/server.ts`
- Clients connect via WebSocket to receive progress updates

## Development Guidelines

### TypeScript Configuration

All packages use **strict TypeScript** with `NodeNext` module resolution. This requires:
- Explicit `.js` extensions in relative imports (even for `.ts` files)
- Example: `import { foo } from './bar.js'` (not `'./bar'` or `'./bar.ts'`)

### Database Changes

1. Modify `packages/database/prisma/schema.prisma`
2. Run `npm run --workspace @carcosa/database db:push` (dev) or `db:migrate` (prod)
3. Run `npm run --workspace @carcosa/database db:generate` to regenerate the Prisma client
4. Rebuild dependent packages (API, web apps) as they reference `@carcosa/database`

### Adding API Endpoints

1. Create route in `apps/api/src/routes/`
2. Create controller in `apps/api/src/controllers/`
3. Create service in `apps/api/src/services/`
4. Add validation schema in `apps/api/src/validations/`
5. Register route in `apps/api/src/routes/index.ts`

### Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (optional, falls back to Postgres for rate limiting)
- `ENCRYPTION_KEY` - 32-byte hex key for encrypting bucket credentials
- `API_URL`, `API_PORT` - API server configuration
- `NEXT_PUBLIC_API_URL` - API URL for frontend
- `NEXTAUTH_SECRET` - NextAuth session secret

### Testing Setup

After initial clone:
```bash
cp .env.example .env
docker compose up -d
npm install
npm run build
npm run --workspace @carcosa/database db:push
npm run --workspace @carcosa/database db:seed
npm run dev
```

API runs on `http://localhost:4000`, web dashboard on `http://localhost:3000`.

## Key Implementation Patterns

### Multi-Storage Support

Projects can use any S3-compatible bucket (S3, R2, MinIO). The storage adapter is selected based on the bucket's provider:

```typescript
// apps/api/src/services/storage.service.ts
const adapter = bucket.provider === 'r2'
  ? new R2Adapter(config)
  : new S3Adapter(config);
```

### Multi-Tenant File Paths

Files are stored with structured paths to isolate tenant data:

```typescript
// apps/api/src/utils/file-paths.ts
const path = `${tenant.id}/${filename}`; // tenant-scoped
const path = `common/${filename}`;       // project-scoped
```

### Rate Limiting

Rate limiting uses Redis (if available) or falls back to Postgres:
- Middleware: `apps/api/src/middlewares/rate-limit.ts`
- Service: `apps/api/src/services/rate.service.ts`
- Configuration per project via `RateLimitConfig` model

### Access Control

All endpoints verify user membership and permissions:
1. Auth middleware verifies JWT token or API key
2. Service layer checks organization/team membership
3. Bucket operations verify `BucketTeamAccess` permissions
4. All operations logged to `AuditLog` table

### API Key Authentication

Two types of authentication:
1. **User JWT tokens** - Session-based via NextAuth (cookies)
2. **API keys** - Project-scoped keys for programmatic access

API key middleware: `apps/api/src/middlewares/api-key.middleware.ts`

## Package Dependencies

When working on packages, be aware of the dependency graph:
- Most packages depend on `@carcosa/types`
- API and web apps depend on `@carcosa/database`
- SDK and CLI depend on `@carcosa/storage` and `@carcosa/types`
- Web apps depend on `@carcosa/sdk`, `@carcosa/cmage`, `@carcosa/ui`

Changes to lower-level packages require rebuilding dependent packages. Turbo handles this automatically via `dependsOn` in `turbo.json`.
