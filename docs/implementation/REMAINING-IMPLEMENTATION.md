## Remaining Implementation Plan (Express-only API, Next.js UI-only)

This document summarizes what exists and lists remaining tasks to fully align the repo to an Express-only API with a UI-only Next.js app, inspired by the target layout.

### Already Implemented
- `apps/api` (Express):
  - Project CRUD (create, fetch), provider credential encryption/decryption (`libsodium`), rate limit (Redis or Postgres fallback), usage tracking, upload init (signed PUT URL), upload callback, list/delete files, version migrate, transform endpoint (Sharp).
  - Env schema (`src/env.ts`), crypto (`src/crypto.ts`), rate limit (`src/rateLimit.ts`).
  - Prisma via `packages/database/prisma/schema.prisma` and local seed using MinIO.
- `apps/web` (Next.js UI):
  - Dashboard pages calling Express endpoints via `NEXT_PUBLIC_API_URL`: Projects, Project detail, Tenants, Tokens, Uploads, Usage.
  - NextAuth demo route still present in `app/api/auth/[...nextauth]` (to be removed).
- Packages:
  - `@carcosa/types`, `@carcosa/storage` (R2/S3), `@carcosa/sdk`, `@carcosa/cmage`, `@carcosa/cli`.
  - Cloudflare Worker template for edge caching.

### High-level Changes To Do
- Remove Next.js API usage and NextAuth server routes from `apps/web`.
- Introduce layered structure in `apps/api` (config/middlewares/validations/services/controllers/routes).
- Add minimal Express auth for dashboard (JWT or bearer) and client-only auth pages in `apps/web`.
- Keep public REST paths stable; move logic into layers.

### Backend Tasks (apps/api)
- [ ] Create `src/server.ts` and bootstrap Express; make `src/index.ts` a re-export for compatibility.
- [ ] Add `src/database/prisma.ts` exporting a singleton `PrismaClient`.
- [ ] Move files:
  - [ ] `src/env.ts` → `src/config/env.ts`
  - [ ] `src/crypto.ts` → `src/utils/crypto.ts`
  - [ ] `src/rateLimit.ts` → `src/middlewares/rate-limit.ts`
- [ ] Add middlewares:
  - [ ] `src/middlewares/error-handler.ts` (uniform error shape)
  - [ ] `src/middlewares/auth.ts` (JWT/bearer guard, project token helper)
- [ ] Add validations (zod):
  - [ ] `src/validations/*.validation.ts` for projects, tenants, tokens, uploads, files, auth
- [ ] Add services: `storage.service.ts`, `projects.service.ts`, `tenants.service.ts`, `tokens.service.ts`, `uploads.service.ts`, `files.service.ts`, `usage.service.ts`.
- [ ] Add controllers and routes to map existing endpoints 1:1 per `PROJECT-RESTRUCTURE.md`.
- [ ] Implement Express auth endpoints:
  - [ ] `POST /api/v1/auth/register` (optional seed/admin)
  - [ ] `POST /api/v1/auth/login` (issues HTTP-only cookie or bearer)
  - [ ] `POST /api/v1/auth/logout`
  - [ ] `GET /api/v1/auth/me`
- [ ] Logging adapter `config/logger.ts` (morgan + optional pino) and `logs/` folder.
- [ ] Update `apps/api/package.json` `start` script to point to `dist/server.js`.

### Database Tasks (packages/database)
- [ ] Extend `User` with `passwordHash String?` (keep NextAuth tables for now; optional cleanup later).
- [ ] Update seed to create an initial admin user with hashed password (bcrypt/argon2).
- [ ] Run `npm run --workspace api db:push` and verify.

### Frontend Tasks (apps/web)
- [ ] Delete `app/api/*` and `app/api/auth/[...nextauth]/route.ts`.
- [ ] Remove NextAuth dependencies from `apps/web/package.json`.
- [ ] Add `app/auth/login/page.tsx` and `app/auth/register/page.tsx` (client-only pages using Express auth endpoints).
- [ ] Add `lib/api.ts` (fetch helper attaching Authorization when logged in).
- [ ] Add `lib/auth.ts` (client auth state: read cookie/localStorage token; helpers for login/logout/me).
- [ ] Wire existing dashboard pages to optional Authorization header if needed.

### SDK/CLI
- [ ] Verify `@carcosa/sdk` methods remain compatible (paths unchanged).
- [ ] Add optional `login`/`whoami` helpers (future) if bearer-based workflows needed for CLI.

### Config & Docs
- [ ] Update `README.md` to reflect Express-only API + web UI-only.
- [ ] Add env examples for JWT secrets and cookie names in `.env.example`.
- [ ] Add `PROJECT-RESTRUCTURE.md` (added) and keep this file updated.

### Milestones
1) Structure & moves (backend files, routes/controllers/services) — no behavior change.
2) Database update for `passwordHash` and seed admin user.
3) Express auth endpoints; web login/register pages.
4) Remove NextAuth server routes and dependencies from `apps/web`.
5) Final pass: docs, envs, smoke tests.

### Smoke Test Checklist
- [ ] `GET /healthz` returns ok.
- [ ] Projects list/create works from dashboard.
- [ ] Tenants list/create/delete works.
- [ ] Tokens list/create/revoke works (bearer optional for management endpoints).
- [ ] Upload init → PUT to signed URL → callback confirm works.
- [ ] Files list/delete works.
- [ ] Transform endpoint streams images with correct cache headers.
- [ ] Usage shows last 30 days.
- [ ] Login/logout/me flows work in web against Express auth.

### Risks & Considerations
- Keep NextAuth tables temporarily to avoid breaking existing data; remove later once Express auth is stable.
- Sharp requires native binaries; confirm Dockerfile for `api` builds on target infra.
- Rate-limits: ensure Redis presence in prod; Postgres fallback is OK for small scale.


