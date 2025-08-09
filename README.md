## Carcosa — developer-first media control plane

Carcosa is a storage-agnostic control plane for uploads, transforms, and multi-tenancy on top of your own Cloudflare R2 or AWS S3. This monorepo contains:

- apps/web: Next.js dashboard (NextAuth v4)
- apps/api: Express API with Sharp transform service and Prisma
- packages/types, packages/storage, packages/sdk, packages/cmage, packages/cli
- templates/cloudflare-worker: Edge cache/proxy template for transforms

### Quickstart

1) Copy envs

```bash
cp .env.example .env
```

2) Start infra

```bash
docker compose up -d
```

3) Install and build

```bash
npm install
npm run build
```

4) Prepare DB and seed demo

```bash
npm run --workspace api db:push
npm run --workspace api db:seed
```

5) Run dev

```bash
npm run dev
```

API on http://localhost:4000, Web on http://localhost:3000. Set `NEXT_PUBLIC_DEMO_PROJECT_ID` to the seeded project ID from step 4 to demo `<Cmage />`.

### SDK usage

```ts
import { CarcosaClient } from '@carcosa/sdk';
const client = new CarcosaClient({ baseUrl: 'http://localhost:4000', apiKey: '...' });
const { uploadUrl } = await client.initUpload({ projectId: '...', fileName: 'cat.jpg', contentType: 'image/jpeg' });
```

### CLI

```bash
npx @carcosa/cli init --base-url http://localhost:4000
npx @carcosa/cli upload ./cat.jpg --project <id>
```
