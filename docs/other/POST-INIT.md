## Carcosa POST-INIT Summary

This repository now contains a runnable Carcosa Turborepo with API, packages, UI component, CLI, CI, Docker, seed scripts, and a Cloudflare Worker template.

### What was added
- **API (`apps/api`)**: Express + Sharp transform service, Prisma + Postgres, credential encryption (libsodium), rate limiting (Redis or Postgres fallback), upload init, list/delete, and transform endpoints.
- **Web (`apps/web`)**: Next.js App Router with NextAuth (credentials provider) and a demo page wiring `<Cmage />`.
- **Packages**: `@carcosa/types`, `@carcosa/storage` (S3/R2), `@carcosa/sdk`, `@carcosa/cmage`, `@carcosa/cli`.
- **Infra/DevX**: `.env.example`, `docker-compose.yml` (Postgres, Redis, MinIO), Dockerfiles for `api` and `web`, CI workflow, Cloudflare Worker template, README updates.

### Packages and entry points
- `@carcosa/types`
  - Entry: `packages/types/src/index.ts`
  - Exposes shared types: storage adapter interfaces, requests/responses, transform options.
- `@carcosa/storage`
  - Entry: `packages/storage/src/index.ts`
  - Adapters: `S3Adapter` and `R2Adapter` using AWS SDK compatible API; methods: `getSignedPutUrl`, `putObject`, `getObject`, `listObjects`, `deleteObject`.
- `@carcosa/sdk`
  - Entry: `packages/sdk/src/index.ts` (client in `src/client.ts`)
  - Methods: `initUpload`, `completeUpload`, `getSignedImageUrl`, `deleteFile`, `listFiles`, `migrateVersion`.
- `@carcosa/cmage`
  - Entry: `packages/cmage/src/index.ts` (`src/cmage.tsx`)
  - SSR-friendly React image component that builds transform URLs and responsive `srcset`.
- `@carcosa/cli`
  - Entry: `packages/cli/src/index.ts`, bin: `carcosa`
  - Commands: `init`, `upload`, `migrate`, `tokens`.

### API highlights (`apps/api`)
- Prisma schema: `apps/api/prisma/schema.prisma`
- Seed script: `apps/api/prisma/seed.ts` (creates demo project using MinIO)
- Env parsing: `apps/api/src/env.ts`
- Rate limit middleware: `apps/api/src/rateLimit.ts`
- Credential crypto: `apps/api/src/crypto.ts`
- Server: `apps/api/src/index.ts`
- Endpoints (v1):
  - `POST /api/v1/projects`: create a project + encrypted provider credentials
  - `POST /api/v1/projects/:id/uploads/init`: get presigned PUT URL
  - `POST /api/v1/uploads/callback`: mark upload complete
  - `GET /api/v1/projects/:id/files?tenant=...`: list files by prefix
  - `DELETE /api/v1/projects/:id/files`: delete by path
  - `POST /api/v1/projects/:id/migrate`: placeholder migration trigger
  - `GET /api/v{n}/transform/:projectId/*path`: on-the-fly Sharp transforms with caching headers

### Web highlights (`apps/web`)
- NextAuth: `apps/web/app/api/auth/[...nextauth]/route.ts` (credentials provider demo)
- Demo page: `apps/web/app/page.tsx` showing `<Cmage />` with `NEXT_PUBLIC_DEMO_PROJECT_ID`

### Infra & CI
- `.env.example` with DB, API, Redis, MinIO, encryption, and web env vars
- `docker-compose.yml` starts Postgres, Redis, MinIO for local dev
- `apps/api/Dockerfile` and `apps/web/Dockerfile`
- GitHub Actions CI: `.github/workflows/ci.yml` (lint, type-check, build)
- Cloudflare Worker template: `templates/cloudflare-worker/edge-cache.ts`

### Quickstart
1) Env
```bash
cp .env.example .env
```
2) Local services
```bash
docker compose up -d
```
3) Install & build
```bash
npm install
npm run build
```
4) DB setup & seed
```bash
npm run --workspace api db:push
npm run --workspace api db:seed
```
5) Dev run
```bash
npm run dev
```
- API: `http://localhost:4000`
- Web: `http://localhost:3000`
- Optional: set `NEXT_PUBLIC_DEMO_PROJECT_ID` to the seeded project ID (from seed output) for the demo image.

### SDK example
```ts
import { CarcosaClient } from '@carcosa/sdk';

const client = new CarcosaClient({ baseUrl: 'http://localhost:4000', apiKey: '...' });

// 1) Init upload
const { uploadUrl, path, uploadId } = await client.initUpload({
  projectId: '...',
  fileName: 'cat.jpg',
  contentType: 'image/jpeg',
});

// 2) PUT the file to the presigned URL
await fetch(uploadUrl.url, { method: 'PUT', body: fileBuffer, headers: { 'content-type': 'image/jpeg' } });

// 3) Confirm
await client.completeUpload({ uploadId });

// 4) Build transform URL
const img = client.getSignedImageUrl({ projectId: '...', path, transform: { width: 800, format: 'webp' } });
```

### `<Cmage />` example
```tsx
import { Cmage } from '@carcosa/cmage';

export default function Demo() {
  return (
    <Cmage
      src={"demo/files/sample.jpg"}
      projectId={process.env.NEXT_PUBLIC_DEMO_PROJECT_ID || "demo"}
      width={320}
      height={200}
      alt="Demo"
    />
  );
}
```

### CLI
```bash
npx @carcosa/cli init --base-url http://localhost:4000
npx @carcosa/cli upload ./cat.jpg --project <id>
npx @carcosa/cli migrate --project <id> --from v1 --to v2
```

### Worker template
- File: `templates/cloudflare-worker/edge-cache.ts`
- Purpose: edge proxy/cache that forwards to Carcosa transform endpoint and caches responses at the edge.

### Notes
- TypeScript strict across packages; ESM with NodeNext resolution (explicit `.js` in relative imports for built output compatibility).
- Sharp runs in the API container; Workers do not run Sharp.
- Credentials are encrypted at rest; only decrypted in backend on demand.


