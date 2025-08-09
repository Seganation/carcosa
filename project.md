CARCOSA — Complete Business & Technical Hybrid Document
One-line: Carcosa = developer-first media control plane that manages uploads, transformations, CDNs, versioning, and multi-tenancy — on top of the developer’s own Cloudflare R2 or AWS S3 storage and their own Cloudflare Workers. Carcosa sells tooling, UI, SDKs, automation, and DX — storage remains owned and billed by the developer.

Table of Contents (this doc)
Executive summary

Business model & GTM

Product scope & key features

UX / UploadThing-inspired UI rules & design principles

High-level architecture

Detailed components & responsibilities

Data model & API specifications

Auth, security, and secrets handling

Image processing strategy (Sharp + worker coupling)

SDK & CLI behavior (npm packages)

Multi-tenancy & versioning design

Rate limiting & usage tracking (self-hosted)

Deployment on Coolify (server), domains, and CDN notes

CI/CD, testing & QA strategy

Monitoring, logging, error handling, and SLOs

Operational playbook (onboarding, key rotation, migrations)

NPM publishing & package naming conventions

Roadmap & optional premium features

First GPT‑5 initialization prompt (paste into cursor)

Appendix: sample config files, environment variables, and checklist

1. Executive summary
(Condensed version — use in pitch decks)

Carcosa is a SaaS control plane for developer-managed object storage (R2/S3).

Developers authenticate Carcosa to their storage via credentials they own. Carcosa:

provides friendly APIs for uploads and signed images,

uses an internal Sharp-based transform service for image processing,

exposes a drop-in React component <Cmage /> that maps to Carcosa transforms,

enables multi-tenant foldering, API versioning, file route migrations, rate-limiting, and usage analytics.

Carcosa charges for tooling and DX — not for storage or worker infrastructure.

2. Business model & go-to-market
Pricing tiers (examples):

Free: Basic usage, 1 project, limited transforms/calls.

Pro ($5/mo): Higher rate limits, multi-tenant, advanced transforms.

Team ($15/mo): Multiple projects, custom domains, webhooks.

Enterprise: custom SLAs, SSO, on-prem/kubernetes support.

Monetization levers:

Monthly subscriptions for dashboard & advanced features.

Paid add-ons: priority support, migration services, custom engineering.

GTM:

OSS-first SDK on npm to attract devs.

Launch on Product Hunt + Indie Hackers + Twitter/X.

Templates & quickstarts for Next.js apps with <Cmage />.

Developer content: blog posts showing upgrades from direct S3 to Carcosa.

Support model: community + paid support channels; documentation with code samples, worker templates, and migration guides.

3. Product scope & key features (what Carcosa provides)
Developer provides their own R2/S3 credentials & Cloudflare Worker token (optional).

Carcosa provides:

Secure credential storage (encrypted).

Upload API (REST) and SDK functions for PUT/POST uploads using signed URLs.

<Cmage /> React component (npm package @carcosa/cmage) — automatic transforms & responsive images.

Transform service (server-side Sharp) — returns optimized images or writes back transformed assets to developer buckets if configured.

Versioned file routes (/v1/.., /v2/..) and a migration tool.

Multi-tenant foldering (project/tenant/files).

Rate limiting and per-project/tenant usage tracking.

Upload UI + dashboard heavily inspired by UploadThing UI/flow.

SDK and CLI (npm) to integrate Carcosa in your pipeline.

Worker templates for Cloudflare Workers that developers can deploy to use edge caching and to orchestrate transform requests.

Not provided by Carcosa:

Storage hosting

Cloudflare Workers hosting

Direct data egress billing (developers pay their provider)

4. UX & UI design principles (UploadThing-inspired)
Design goal: delight developers — small onboarding friction + instant “it works”.

Core rules:

Minimal required form fields to get started (project name, provider, bucket, access key, secret).

One-click “test connection” feedback with clear UX on common failure causes.

Visual project list, with badges for “multi-tenant”, “connected R2/S3”.

Upload flow: drag & drop, show immediate URL on success, preview images inline.

<Cmage /> docs with code snippets for Next.js, React, and instructions to copy/paste worker snippets.

Usage & analytics panel: storage ops, transforms per month, and per-tenant breakdown.

API keys UI: one-click rotate, revoke, and a short client snippet to copy.

Design language: keep UploadThing rhythm — high contrast CTA, modular cards, code blocks, and copy that’s terse and confident.

5. High-level architecture (conceptual)
Actors:

Developer (user)

Carcosa dashboard/front-end (Next.js)

Carcosa backend API (Express)

Carcosa transform worker (internal Sharp service)

Developer storage provider (R2 or S3) — owned by developer

Developer Cloudflare Worker — optional; developer deploys worker to the edge; Carcosa provides templates and tokens

Postgres DB (for metadata) — self-hosted

Redis (self-hosted in Coolify) for rate-limits & ephemeral cache — optional but recommended

Flow summary:

Developer registers and adds storage credentials (R2 or S3) in Carcosa.

Carcosa validates credentials and stores them encrypted.

Developer integrates @carcosa/sdk or uses dashboard; uploads are routed using signed URLs or direct SDK POSTs.

For image display, <Cmage /> emits a Carcosa transform URL; the transform service fetches the original from developer's bucket using stored credentials, applies Sharp transforms, caches, and returns optimized image (optionally saves transform back to the developer’s bucket).

Developer can deploy Cloudflare Worker (provided template) to run at the edge: it can call Carcosa transforms, cache results in the edge, and serve directly from the developer’s custom domain.

6. Detailed components & responsibilities
6.1 Apps & packages (npm, Turborepo structure)
Use npm workspaces (monorepo) and Turborepo for task orchestration. All packages are published to npm under @carcosa/*.

Suggested structure:

ruby
Copy
Edit
carcosa/
├─ apps/
│  ├─ web/             # Next.js dashboard (NextAuth v4)
│  └─ api/             # Express backend (REST)
├─ packages/
│  ├─ cmage/           # @carcosa/cmage React component
│  ├─ sdk/             # @carcosa/sdk JS/TS client
│  ├─ storage/         # @carcosa/storage-adapters (r2 & s3)
│  ├─ ui/              # shared UI components inspired by UploadThing
│  ├─ cli/             # @carcosa/cli
│  └─ types/           # shared TypeScript types
├─ infra/               # deployment manifests for Coolify (docker-compose etc.)
└─ docs/
All packages are published to npm and follow semantic versioning.

6.2 Backend (Express) responsibilities
Auth endpoints (NextAuth used for dashboard; API-level tokens for SDK)

Project CRUD & credential storage (encrypted secrets)

Upload initiation endpoints:

POST /api/v1/projects/:id/uploads/init → returns signed URL or upload token

POST /api/v1/uploads/callback → (optional) confirm upload

Transform endpoints:

GET /api/v1/transform/:projectId/*path → apply transforms (width, format, quality, crop, etc.)

POST /api/v1/transform/migrate → migration handler

File listing & metadata: GET /api/v1/projects/:id/files

Webhooks management

Usage and analytics endpoints

Admin endpoints: revoke keys, rotate keys, run migrations

Important: Express service uses the developer's stored credentials to call R2/S3 on their behalf.

6.3 Transform Service (Sharp)
Runs as part of the backend or as a separate worker process (container). Implemented with Sharp (Node.js native).

Responsibilities:

Fetch original from dev's bucket (using storage adapter).

Apply transforms (resize, format conversion, compress, watermark).

Cache transformed image in a transform cache (either developer bucket path like /carcosa-cache/project/v2/... or Carcosa-managed transform_cache in developer bucket).

Return optimized image to client (with correct cache headers).

Optionally, persist transformed image back to developer bucket so workers/CDN can serve static transforms.

For scale: use a queue (BullMQ) with Redis for heavy transforms; for simple on-demand transforms, serve synchronously with caching.

Note about Cloudflare Workers: Cloudflare Workers cannot run Sharp (native binaries). The architecture uses Workers as edge proxies/cache: the worker calls Carcosa transform endpoint (hosted on your server) which runs Sharp, returns optimized image — worker caches result at edge and serves to the end user. Alternatively, Carcosa can persist transformed assets into the developer’s bucket; Workers can serve from there.

6.4 Storage Adapters
Implement @carcosa/storage with two adapters implementing the same interface:

R2Adapter — wraps @aws-sdk/client-s3 with R2 endpoint

S3Adapter — wraps AWS SDK S3 client

Key functions:

getSignedPutUrl(path, options) — returns presigned PUT URL

putObject(path, streamOrBuffer, meta)

getObject(path) — stream or buffer

listObjects(prefix)

deleteObject(path)

Adapters read the project's encrypted credentials from DB, instantiate clients per-request with those credentials (never persist raw creds in process memory longer than needed).

6.5 SDK (@carcosa/sdk)
Developer-facing, published on npm. Provides:

CarcosaClient({ apiKey, baseUrl })

initUpload({ projectId, fileName, tenantId, meta }) → { uploadUrl, method, headers }

completeUpload({ uploadId, metadata }) → confirm

getSignedImageUrl({ projectId, path, transformOptions }) → returns Carcosa transform URL

deleteFile({ projectId, path })

listFiles({ projectId, tenantId })

migrateVersion({ projectId, fromVersion, toVersion }) — triggers server-side migration

Light usage helpers (retry, chunk uploads)

Types and TS declarations for DX

Package naming convention: @carcosa/sdk, @carcosa/cmage, @carcosa/storage, @carcosa/cli, @carcosa/ui.

6.6 React <Cmage /> (@carcosa/cmage)
Props:

src (path or file id)

projectId or projectSlug

tenantId?

width?, height?, quality?, format?

priority?, loading?, placeholder?

Behavior:

Build transform query (e.g., ?w=400&q=80&f=webp&fit=cover)

Use getSignedImageUrl via SDK (or generate client-side URL) to build <img src> or <picture> with srcset for responsive images

Provide lazy-loading, placeholder blur, retina support

Expose prefetch() method for critical images

Proper caching headers are set by the transform endpoint (CDN-friendly)

7. Data model & API specifications
7.1 DB schema (high-level)
projects:

id, name, slug, ownerId, provider (r2 | s3), config (json), createdAt, updatedAt

providers:

id, projectId, type, bucketName, region, endpoint, encryptedAccessKey, encryptedSecretKey, createdAt

tenants:

id, projectId, slug, metadata

files:

id, projectId, tenantId, path, version, size, mimeType, uploadedAt, metadata (json)

versions:

id, projectId, versionName, isActive, createdAt

apiKeys:

id, projectId, key, scopes, createdAt, revokedAt

7.2 Key API endpoints (REST v1 examples)
Auth:

POST /api/v1/auth/login (dashboard login via NextAuth)

GET /api/v1/auth/me

Projects:

POST /api/v1/projects — create project (provider selection)

GET /api/v1/projects/:id

POST /api/v1/projects/:id/validate-credentials — test keys

Upload:

POST /api/v1/projects/:id/uploads/init — returns signed upload URL

POST /api/v1/uploads/callback — optional callback to track completion (signature verified)

GET /api/v1/projects/:id/files?tenant=foo

Transform:

GET /api/v1/projects/:id/transform/*path — query params: w, h, q, f, fit, crop, format, etc.

Versioning:

POST /api/v1/projects/:id/versions — create new version

POST /api/v1/projects/:id/migrate — migration endpoint

Admin / Usage:

GET /api/v1/projects/:id/usage

POST /api/v1/projects/:id/rate_limit — configure limits

All endpoints that touch user storage must re-check developer’s credential validity and enforce per-project quotas and limits.

8. Auth, secrets, and security
8.1 Authentication
Dashboard: NextAuth v4 for developer authentication (supports OAuth providers, Email, and credentials).

API for SDK: API keys per project (use long random tokens stored hashed in DB; reveal raw token only when created).

Internal auth: JWT with short TTL for signed endpoints.

8.2 Secret storage & handling
Encrypt at rest: Use libsodium or a KMS to encrypt access_key and secret_key stored in DB.

Access controls: only decrypt in the backend on demand; never send raw credentials to frontend.

Rotation: provide UI to rotate provider credentials and API keys.

Audit logs: store actions that used credentials (who/when).

8.3 Signed URLs and HMAC
For private transform endpoints, issue signed transform URLs with expiry using HMAC (server secret).

Validate HMAC on transform endpoint before performing costly transforms.

8.4 Network & infra security
Deploy backend internally on Coolify; enable HTTPS/TLS.

Use firewall rules; limit admin panel to IP ranges if needed.

Enforce rate limits and throttling.

9. Image processing strategy (Sharp + worker coupling)
Because Carcosa does not run Cloudflare Workers, you must provide a secure, compatible model:

9.1 Transform API using Sharp
Carcosa runs a transform service (Sharp) on your backend containers.

Transform steps:

Validate HMAC / API key.

Check cache (developer bucket path / local cache / redis).

If cached transformed file exists, return redirect or stream with cache headers.

If not, fetch original from developer’s bucket via storage adapter.

Use Sharp to process (resize, format convert, compress).

Store transformed image back to developer’s bucket (optionally under /_carcosa_cache/project/version/...) or into a Carcosa-managed cache in the developer bucket.

Return transformed image (and proper cache-control).

9.2 Cloudflare Worker integration (developer side)
Carcosa publishes worker templates developers can deploy:

Worker acts as edge cache/proxy:

Receive request cdn.devsite.com/image?src=...&w=...

Add authentication (developer’s worker secret) to call Carcosa transform endpoint

Cache on edge; serve response with optimal headers

Workers cannot run Sharp — they call Carcosa’s transform API and cache result at edge via Cloudflare cache.

Alternatively, worker can call Carcosa to persist transformed assets into their bucket and then serve from bucket via CDN.

9.3 Caching & caching strategy
TTL: set long Cache-Control for transformed images.

Invalidation: expose API to purge a cached transform for migrations or updates.

Persist transformed assets in developer bucket to reduce repeated transforms.

10. SDK & CLI behavior (npm-based)
10.1 @carcosa/sdk
Lightweight: no native deps.

Uses fetch or native HTTP library.

Provides typed methods for upload/init, signed URL retrieval, and file management.

Auto retries on presigned upload latency failures.

Exports helper to compose <Cmage /> props (optional).

10.2 @carcosa/cmage
React component with SSR compatibility.

Works with Next.js (server and client rendering). For SSR, generate transform URL server-side using SDK.

Exposes an imperative prefetch and preconnect support.

10.3 @carcosa/cli
NPM binary: carcosa

Commands:

carcosa init — create project skeleton and .carcosa config

carcosa upload <file> — upload via CLI to developer bucket using Carcosa signed URL

carcosa migrate --from v1 --to v2 — kick off server migration job

carcosa tokens — manage tokens locally (open dashboard URL)

Use commander + zod for validation.

Important: Everything published to npm under @carcosa/*. Use npm scripts in each package for build/test/publish.

11. Multi-tenancy & versioning design
11.1 Multi-tenancy
Tenant concept is optional per project.

When enabled:

SDK accepts tenantId param on uploads and file operations.

Storage path: /project-slug/{tenantId}/files/....

Dashboard UI shows tenant list, usage breakdown.

Rate-limits and quotas applied per tenant by default.

11.2 Versioning
Each project has activeVersion (default v1).

File URLs built with version prefix: /project/v1/path.

Migration flow:

migrate endpoint enumerates files, transforms or moves them to new version, updates metadata.

Provide CLI command carcosa migrate to run from dev machine (calls backend to orchestrate).

Keep old versions accessible until dev deprecates them.

12. Rate limiting & usage tracking (self-hosted)
Store counters in Redis (self-hosted in Coolify).

Per-project quotas:

uploads/minute, transforms/hour, bandwidth/month

Track total operations in DB for billing.

Implement middleware in Express to check quotas:

Use token-based identification.

On limit exceeded → return 429 with Retry-After and usage info.

If user wants zero Redis dependency, a Postgres-based counters table with upsert and TTL cleanup can be used (less performant but acceptable for small scale).

13. Deployment on Coolify (self-hosted)
Use Docker for each service:

api (Express + transform)

web (Next.js)

worker (optional background jobs)

postgres (managed or self-hosted)

redis (self-hosted)

Use Coolify to deploy images easily and provide env var management (KMS or secrets).

Configure scaling: CPU/Memory, container restarts, and allocate enough for Sharp native libs.

Use reverse proxy (traefik / nginx) with TLS managed via Let’s Encrypt or your own cert.

14. CI/CD, testing & QA strategy
CI (GitHub Actions): run tests for packages (unit), build packages, run lints.

CD: on merge to main:

Build Docker images

Push images to internal registry

Deploy to Coolify via API (or manual)

Testing:

Unit tests for storage adapters (mock S3/R2).

Integration tests for upload flow (local MinIO for S3).

E2E tests for <Cmage /> integration (Playwright).

Pre-release: Use canary tags for npm packages (@carcosa/sdk@canary).

15. Monitoring, logging & SLOs
Centralized logs (ELK / Grafana Loki) — collect backend and transform logs.

Metrics:

Request latency, success rates, transform queue lengths.

Track transforms per minute and bandwidth.

Alerts:

Transform error surge

Failed credential validations

Disk pressure on transform containers

SLO examples:

99% successful transform within 500ms for cached items.

99% uptime for API.

16. Operational playbook (onboarding & ops)
Onboard:

Create account → create project → pick provider → enter credentials → validate.

Carcosa runs test access and optionally creates /_carcosa_cache prefix in bucket for caching.

Key rotation:

Revoke previous credentials in UI → update provider credentials → re-validate.

Migration:

Use CLI or dashboard “migrate” tool; show preview list; run in background job.

Support:

Logs accessible per project with masked tokens.

17. NPM publishing & package naming
Use @carcosa/* scope. Example packages:

@carcosa/sdk

@carcosa/cmage

@carcosa/storage-r2

@carcosa/storage-s3

@carcosa/ui

@carcosa/cli

Follow semantic versioning. Publish with CI after passing tests.

Provide README.md with usage examples for each package.

18. Roadmap & optional premium features
Webhooks for upload/transforms.

Video transforms (ffmpeg) and thumbnails.

Branded CDN + custom domain config (developer provides CNAME).

Enterprise SSO and on-prem connector for compliance.

AI-powered image moderation as add-on.

19. FIRST GPT‑5 INITIALIZATION PROMPT (copy/paste into cursor)
Important: This prompt is intentionally long and explicit. Paste it as a single message to GPT‑5 in your cursor chat in a newly created repo folder. The prompt instructs GPT‑5 to scaffold everything via npm (npm workspaces), implement logic, wire auth (NextAuth v4), build the Express backend + Sharp transform API, create storage adapters for Cloudflare R2 and AWS S3, create @carcosa/cmage React component, @carcosa/sdk, @carcosa/cli, minimal UI heavily inspired by UploadThing’s UX, tests, example Cloudflare Worker templates, deployment manifests for Coolify, and README + migration tools. It instructs the AI to produce runnable code and to commit to the repo structure.

GPT‑5 Initialization Prompt (paste as one message):

pgsql
Copy
Edit
You are GPT‑5 and your task is to fully scaffold, implement, and generate a complete Carcosa Turborepo project that is ready to run and deploy — with no additional manual coding required by the developer. Use npm workspaces (not pnpm) and Turborepo for build orchestration. The entire project will be published as multiple npm packages under the scope `@carcosa/*`. Produce runnable code, Dockerfiles, Coolify deployment manifests, CI/GitHub Actions, and tests. Follow the specification below EXACTLY.

GOALS:
- Carcosa must be a storage-agnostic developer control plane: developers bring their own Cloudflare R2 or AWS S3 credentials and (optionally) Cloudflare Worker tokens. Carcosa DOES NOT provide storage or Workers. Carcosa manages uploads, transforms, multi-tenancy, versioning, rate limiting, and DX.
- Everything must be implemented with npm packages and scripts, and code must be TypeScript (strict).
- Use NextAuth v4 for dashboard auth.
- Backend must be Express (Node.js) and include the transform API using Sharp.
- Provide two storage adapters: `R2Adapter` and `S3Adapter` in `@carcosa/storage`.
- Provide an SDK `@carcosa/sdk` with methods: `initUpload`, `completeUpload`, `getSignedImageUrl`, `deleteFile`, `listFiles`, `migrateVersion`.
- Provide a React component package `@carcosa/cmage` that is SSR compatible and a drop-in replacement for `<img>`. It should accept props: `src`, `projectId`, `tenantId?`, `width?`, `height?`, `quality?`, `format?`, `placeholder?`, `priority?`. It must call Carcosa transform API to generate optimized images and support responsive `srcset`.
- Provide `@carcosa/cli` with commands: `init`, `upload`, `migrate`, and `tokens`. CLI must be Node-based and runnable via `npx`.
- UI must be heavily inspired by UploadThing: simple onboarding wizard, project list card UI, drag-drop upload UI, one-click key rotation and add provider modal, usage charts, tenant manager. Use Tailwind and Shadcn-like component conventions (create simple components).
- Provide Cloudflare Worker templates (TypeScript) that developers can copy/paste and deploy; the worker acts as an edge cache/proxy calling Carcosa transform endpoint. Make it clear these workers run on developer’s Cloudflare account; Carcosa only provides the template and optional helper token.
- Implement multi-tenancy path convention: `{projectSlug}/{tenantSlug}/files/{filename}` when tenanting enabled, otherwise `{projectSlug}/files/{filename}`.
- Implement versioning: route transforms via `/api/v{n}/transform/{projectId}/{path}` and provide migration API.
- Provide rate-limiting middleware using Redis (allow use of self-hosted Redis or fallback to Postgres counters if Redis not present).
- Implement secure storage of developer credentials (encrypted at rest using libsodium or similar) and key rotation in dashboard.
- Include example tests: unit tests for storage adapters (mock), integration tests using local S3 emulator (MinIO) or mocked R2.
- Add Github Actions workflows: test, lint, build, publish-canary.
- Add Dockerfiles for `api` and `web` apps and `docker-compose` for local dev including Postgres and Redis for Coolify compatibility.
- Add README root and per-package READMEs, code comments, and API docs generation (typedoc config).
- Add sensible default env var schemas for `.env.example` files.

CONSTRAINTS & NOTES:
- Use TypeScript strict mode throughout.
- Use Express for backend and Next.js (App Router) for frontend (`apps/web`). Use NextAuth v4 for web auth. Use `@carcosa/*` package names.
- Do NOT provide any storage hosted by Carcosa. Always call developer-provided credentials.
- Implement Sharp transforms in the backend. Provide worker templates that call transform endpoints and cache results at edge.
- Publishable packages must be buildable via `npm run build` from root or per-package.
- Provide an initial demo seeded DB script that creates a test developer account, a test project (connects to a local MinIO bucket), and a sample image.
- Provide clear step-by-step README: how a developer registers, adds their own R2 or S3 keys, tests connection, uses `@carcosa/cmage` in a Next.js app, deploys a Cloudflare Worker template, and runs a migration.
- Make sure all secrets handling is explicit and safe: show how to set env vars, and how to encrypt/decrypt provider credentials on the server.

OUTPUT:
- Create all files and commit them as a single repo. Ensure `npm install` and `npm run dev` from repo root starts the monorepo locally (frontend, backend, test DB). Put clear console output on successful start (URLs).
- Produce a final `POST-INIT` summary at the end: list all created packages, their entry points, example usage snippets for SDK and `<Cmage />`, and `npx` commands for the CLI.

Now scaffold and implement everything exactly following these instructions. Start by generating the Turborepo + npm-workspace config and then implement packages step-by-step. After scaffolding, run tests (inside the AI environment simulation) and ensure everything builds. If any native dependency (e.g., Sharp) needs additional OS packages, include Dockerfiles with the correct setup steps.

Everything must be committed into version control with meaningful commit messages and final `README.md` at root describing how to run everything.  
20. Appendix: essential environment variables & checklist
20.1 Example .env (for local dev)
ini
Copy
Edit
# Postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/carcosa

# NextAuth (dashboard)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_this_secret

# Express API
API_URL=http://localhost:4000
API_PORT=4000
API_SECRET=supersecret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# NPM / Publishing
NPM_TOKEN=your_npm_token

# For local MinIO (S3 emulation)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=carcosa-demo

# Encryption key for provider credentials
CREDENTIALS_ENCRYPTION_KEY=base64:32bytekeyhere
20.2 Starter checklist (first run)
 Clone repo

 npm install

 Start local services: docker-compose up -d (postgres, redis, minio)

 npm run dev (root) to start web + api

 Login to dashboard (/auth) with seeded dev

 Create project → choose provider S3 and point to MinIO sample

 Test upload via SDK sample

 Try <Cmage /> in demo page

Final notes & clarifications (important)
Carcosa does not and will not run or bill for developer storage. That is the core product differentiator. Carcosa only requires dev-provided R2/S3 credentials to perform operations on behalf of the dev.

Workers: Carcosa provides templates and tokens for developers to deploy on their Cloudflare Workers accounts; Carcosa does not host or run those workers.

Everything is published on npm and designed to be consumed via @carcosa/*.

DX is crucial: your dashboard and @carcosa/cmage must be polished and simple — push to make onboarding 2–3 minutes for any developer.

