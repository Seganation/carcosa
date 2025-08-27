## Carcosa Project Restructure (Express-only API, Next.js UI-only)

This plan removes all Next.js API usage and adopts an Express-only backend while keeping Next.js strictly for UI. The structure and layering follow the inspiration project layout you shared.

### Objectives
- **Express-only APIs**: all routes in `apps/api`.
- **Next.js UI only**: delete `apps/web/app/api/*` and any server-side NextAuth handlers.
- **Layered backend**: `config` → `middlewares` → `validations` → `services` → `controllers` → `routes`.
- **Stable public paths**: keep existing REST paths; move logic out of `apps/api/src/index.ts` into layers.

### New Monorepo Layout
```text
carcosa/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ server.ts                 # app bootstrap (was index.ts)
│  │  │  ├─ index.ts                  # re-export server.ts for build/start
│  │  │  ├─ config/
│  │  │  │  ├─ env.ts                # from current src/env.ts (zod-validated)
│  │  │  │  ├─ logger.ts             # morgan/pino adapter
│  │  │  │  └─ cors.ts               # CORS policy
│  │  │  ├─ database/
│  │  │  │  └─ prisma.ts             # PrismaClient singleton
│  │  │  ├─ middlewares/
│  │  │  │  ├─ rate-limit.ts         # from src/rateLimit.ts
│  │  │  │  ├─ auth.ts               # bearer/JWT guard + project token helper
│  │  │  │  └─ error-handler.ts      # central error/response formatter
│  │  │  ├─ validations/
│  │  │  │  ├─ auth.validation.ts
│  │  │  │  ├─ projects.validation.ts
│  │  │  │  ├─ tenants.validation.ts
│  │  │  │  ├─ tokens.validation.ts
│  │  │  │  ├─ uploads.validation.ts
│  │  │  │  └─ files.validation.ts
│  │  │  ├─ services/
│  │  │  │  ├─ storage.service.ts    # wraps @carcosa/storage + decrypted creds
│  │  │  │  ├─ projects.service.ts
│  │  │  │  ├─ tenants.service.ts
│  │  │  │  ├─ tokens.service.ts
│  │  │  │  ├─ uploads.service.ts
│  │  │  │  ├─ files.service.ts
│  │  │  │  └─ usage.service.ts
│  │  │  ├─ controllers/
│  │  │  │  ├─ health.controller.ts
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ projects.controller.ts
│  │  │  │  ├─ tenants.controller.ts
│  │  │  │  ├─ tokens.controller.ts
│  │  │  │  ├─ uploads.controller.ts
│  │  │  │  ├─ files.controller.ts
│  │  │  │  ├─ usage.controller.ts
│  │  │  │  └─ transform.controller.ts
│  │  │  ├─ routes/
│  │  │  │  ├─ auth.routes.ts
│  │  │  │  ├─ projects.routes.ts
│  │  │  │  ├─ tenants.routes.ts
│  │  │  │  ├─ tokens.routes.ts
│  │  │  │  ├─ uploads.routes.ts
│  │  │  │  ├─ files.routes.ts
│  │  │  │  ├─ usage.routes.ts
│  │  │  │  └─ transform.routes.ts
│  │  │  ├─ utils/
│  │  │  │  ├─ crypto.ts             # from src/crypto.ts
│  │  │  │  ├─ responses.ts          # success/error helpers
│  │  │  │  └─ id.ts                 # cuid/uuid helpers (optional)
│  │  │  └─ sockets/                 # (optional) realtime usage
│  │  ├─ logs/
│  │  │  ├─ error.log
│  │  │  └─ combined.log
│  │  └─ prisma/
│  │     └─ seed.ts
│  └─ web/
│     ├─ app/
│     │  ├─ (dashboard)/layout.tsx
│     │  ├─ page.tsx
│     │  ├─ auth/                     # client-only auth pages (login/register)
│     │  ├─ projects/
│     │  ├─ tenants/
│     │  ├─ uploads/
│     │  └─ usage/
│     ├─ lib/
│     │  ├─ api.ts                   # fetch helpers to Express
│     │  └─ auth.ts                  # client auth state (no NextAuth server)
│     └─ (remove) app/api/*          # delete Next.js API routes
├─ packages/
│  ├─ database/                       # prisma schema (already here)
│  ├─ storage/
│  ├─ types/
│  ├─ sdk/
│  ├─ cmage/
│  └─ ui/
```

### Routing Map → Controllers
- `GET /healthz` → `HealthController.status`
- Projects
  - `GET /api/v1/projects` → `ProjectsController.list`
  - `GET /api/v1/projects/:id` → `ProjectsController.get`
  - `POST /api/v1/projects` → `ProjectsController.create`
  - `POST /api/v1/projects/:id/validate-credentials` → `ProjectsController.validateCredentials`
  - `POST /api/v1/projects/:id/migrate` → `ProjectsController.migrateVersion`
  - `GET /api/v1/projects/:id/rate_limit` → `ProjectsController.getRateLimit`
  - `POST /api/v1/projects/:id/rate_limit` → `ProjectsController.upsertRateLimit`
  - `GET /api/v1/projects/:id/usage` → `UsageController.dailyForProject`
- Tenants
  - `GET /api/v1/projects/:id/tenants` → `TenantsController.list`
  - `POST /api/v1/projects/:id/tenants` → `TenantsController.create`
  - `DELETE /api/v1/projects/:id/tenants/:tenantId` → `TenantsController.delete`
- Tokens
  - `GET /api/v1/projects/:id/keys` → `TokensController.list`
  - `POST /api/v1/projects/:id/keys` → `TokensController.create`
  - `POST /api/v1/projects/:id/keys/:keyId/revoke` → `TokensController.revoke`
- Uploads & Files
  - `POST /api/v1/projects/:id/uploads/init` → `UploadsController.init`
  - `POST /api/v1/uploads/callback` → `UploadsController.confirm`
  - `GET /api/v1/projects/:id/files` → `FilesController.list`
  - `DELETE /api/v1/projects/:id/files` → `FilesController.delete`
- Transform
  - `GET /api/v{n}/transform/:projectId/*path` → `TransformController.handle`

### Auth (remove Next.js API, move to Express)
- Delete `apps/web/app/api/auth/[...nextauth]` and NextAuth API usage.
- Add Express endpoints:
  - `POST /api/v1/auth/register` (optional for initial admin)
  - `POST /api/v1/auth/login` → issue HTTP-only cookie (JWT) or bearer token
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- DB: extend `User` with `passwordHash` (bcrypt/argon2). Keep NextAuth tables temporarily; deprecate later.
- Web: UI pages under `apps/web/app/auth/*` call Express; client-only helpers in `apps/web/lib/auth.ts`.

### Middleware & Policies
- Global: CORS, JSON body, logging, `rate-limit.ts`, `error-handler.ts`.
- Auth guard: `middlewares/auth.ts` to enforce bearer/JWT for dashboard-management routes.
- Project rate limits: keep Redis→Postgres fallback (already implemented) as service/middleware.

### Services
- `storage.service.ts`: decrypt provider credentials, return `R2Adapter`/`S3Adapter` per project.
- Move Prisma from monolithic `src/index.ts` into `projects/tenants/tokens/uploads/files/usage` services.

### Web (UI-only)
- Remove `apps/web/app/api/*` and NextAuth server code.
- Remove NextAuth deps from `apps/web/package.json`.
- Add `apps/web/lib/api.ts` to attach Authorization headers when logged in.

### Cutover Steps
1) Split `apps/api/src/index.ts` into `server.ts`, `routes/*`, `controllers/*`, `services/*`, `middlewares/*`.
2) Move `src/env.ts` → `config/env.ts`, `src/crypto.ts` → `utils/crypto.ts`, `src/rateLimit.ts` → `middlewares/rate-limit.ts`.
3) Add `database/prisma.ts` exporting a shared `PrismaClient`.
4) Implement Express auth endpoints + add `passwordHash` to `User`; update seed accordingly.
5) Remove `apps/web/app/api/*` and NextAuth deps; add UI login/register and `lib/auth.ts` client helpers.
6) Update `apps/api/package.json` start target to `dist/server.js`.
7) Verify SDK/CLI compatibility (they already target Express endpoints).
8) Build and smoke test all dashboard pages (Projects, Tenants, Tokens, Uploads, Usage).

### Alignment with Inspiration Layout
- Mirrors folders: `config/`, `controllers/`, `middlewares/`, `routes/`, `services/`, `validations/`, `utils/`, `logs/`.
- Central Prisma in `packages/database` with local `database/prisma.ts` for client reuse.
- Clean separation of concerns and scalable structure.


