Short answer: no—it’s way more than “S3 + presigned URLs.” UploadThing is a managed upload + file serving platform with a typed server router, ready-made UI, a global CDN, access controls, regions, and an admin API, all designed to snap into modern TS frameworks (esp. Next.js). Here’s the deep-dive feature map:

What it actually does
Core model (server)

Typed file routes: define endpoints with allowed file types, max sizes/counts, custom input/metadata validators, and strongly-typed callbacks. Routes support a .middleware() (auth/rate-limit/etc.) and .onUploadComplete() handler. 
UploadThing Docs

“Server data” plumbing: pass typed data into your callbacks and back to the client without hand-rolled validators. 
UploadThing Docs

Security built-in: upload completion callbacks are HMAC-signed; guidance and helpers to prevent spoofing and to restrict unauthenticated uploads using .middleware(). 
UploadThing Docs

Upload flows (client + API)

Direct-to-storage uploads with progress, drag-drop, paste-to-upload, programmatic starts/stops (abort), and resumable retries (via HTTP Range) if a connection drops. 
UploadThing Docs

Two ways to upload: via the File Router (recommended) or direct server uploads using UTApi.uploadFiles(...). There’s also upload from URL (uploadFilesFromUrl). 
UploadThing Docs
+1

OpenAPI REST spec if you want to build your own SDKs or wire non-JS clients. 
UploadThing Docs

Frontend DX

Prebuilt React components (UploadButton, UploadDropzone, Uploader) + a useUploadThing hook; you generate typed wrappers so props & endpoints stay in sync with your server routes. Theming via one CSS import. 
UploadThing Docs

Works across frameworks: Next.js (App/Pages), Remix/React Router, SvelteKit, SolidStart, TanStack Start, Vue/Nuxt, Astro (with React), plus Expo for React Native. 
UploadThing Docs

Backend adapters for Express, Fastify, H3, and a WinterCG fetch adapter for workers/edge-like runtimes, plus guidance for custom adapters.

File serving & access control

CDN file URLs on your app subdomain: https://<APP_ID>.ufs.sh/f/<FILE_KEY> (or your customId). Old utfs.io still works but isn’t recommended. Next.js image optimization examples included. 
UploadThing Docs

Public vs. Private files (ACL): configure a default at the app level; optionally allow per-request overrides; private files require presigned GETs. 
UploadThing Docs

Signed GETs: generate presigned URLs on your server with UTApi.generateSignedURL (no network hop). Max TTL 7 days. A slower getSignedURL exists for completeness. 
UploadThing Docs

Regions: choose where new files are stored (default currently AWS us-west-2). Regions & Private files are paid-plan features. 
UploadThing Docs

Admin / Server API (UTApi)

Manage files: deleteFiles, listFiles (paginated), renameFiles, set content disposition, append metadata, and set ACL at upload time. getFileUrls is deprecated (use the deterministic CDN URL). 
UploadThing Docs

Config niceties: default key type (fileKey vs customId), concurrency for bulk server uploads, logging controls, and token/env-based setup. 
UploadThing Docs

Performance & reliability

v7 speedups (architecture changes cut hops/polling; materially faster multi-image uploads). 
UploadThing Docs

Dev/Prod ergonomics: guidance for Next.js middleware and Edge/Node runtime quirks; callbacks auto-simulate in dev and hit your deployed URL in prod. 
UploadThing Docs

Pricing & what’s included

Free tier (storage pooled across apps) and paid tier unlock Regions and Private Files; dashboard shows audit-log retention differences by plan. 
uploadthing

What it deliberately doesn’t do (today)

No “bring your own bucket.” UploadThing manages storage behind a stable CDN URL and reserves the right to move objects across providers/buckets—so you don’t bind to raw S3/GCS URLs. (Use the ufs.sh URL.) 
UploadThing Docs

No built-in media transforms/pipelines like Cloudinary/Imgix (you’d pair those yourself if needed). (This is by design—UT focuses on the upload/serve/ACL layer; see docs emphasis on deterministic CDN URLs and your own processing.)

Why devs pick it over rolling your own S3

You skip building: presign flows, UI components, progress/resume logic, webhook/callback verification, ACL + signed GETs, region selection, and a file admin API. You also get consistent CDN URLs that won’t break if storage backends change, plus typed end-to-end DX that matches your framework. 
UploadThing Docs
+2
UploadThing Docs
+2