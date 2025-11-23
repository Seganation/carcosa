# Carcosa Package Strategy & User Workflow

**Goal**: Make it dead simple for developers to use Carcosa in their apps

---

## 📦 Current Package Structure Analysis

### What We Have Now (12 packages)

```
packages/
├── database/          # ❌ INTERNAL ONLY - Prisma schema for Carcosa platform
├── storage/           # ❌ INTERNAL ONLY - S3/R2 adapters for platform
├── ui/                # ❌ INTERNAL ONLY - Dashboard UI components
├── types/             # ⚠️  SHARED - TypeScript types
├── eslint-config/     # ❌ INTERNAL ONLY - ESLint config
├── typescript-config/ # ❌ INTERNAL ONLY - TypeScript config
├── prisma-adapter/    # ⚠️  OPTIONAL - For NextAuth users
├── file-router/       # ✅ DEVELOPER FACING - Core upload system
├── sdk/               # ✅ DEVELOPER FACING - Client SDK
├── nextjs/            # ✅ DEVELOPER FACING - Next.js integration
├── cmage/             # ✅ DEVELOPER FACING - React image component
└── cli/               # ✅ DEVELOPER FACING - CLI tool
```

### What Developers Actually Need

**Only 3-4 packages** that developers install:

1. **`carcosa`** (or `@carcosa/nextjs`) - Main package for Next.js
2. **`@carcosa/react`** (optional) - For React without Next.js
3. **`@carcosa/cli`** (optional) - For CLI operations

---

## 🎯 Proposed Simplified Structure

### Option A: UploadThing Style (Recommended)

**How UploadThing does it:**
```bash
npm install uploadthing
```

One main package with everything:
- Client SDK
- Server utilities
- React hooks/components
- Next.js integration

**For Carcosa:**
```bash
npm install carcosa
```

One package that includes:
- Client SDK (`CarcosaClient`)
- File router (`createUploadRouter`, `f`)
- React components (`<UploadButton>`, `<Cmage>`)
- Next.js utilities

**Internal packages** (not published to npm):
- `@carcosa/database` - Platform database (stays internal)
- `@carcosa/storage` - Platform storage (stays internal)
- `@carcosa/ui` - Dashboard UI (stays internal)

**Optional packages** (published):
- `@carcosa/cli` - CLI tool (separate install)

### Option B: Scoped Packages (More Flexible)

```bash
# For Next.js users (most common)
npm install @carcosa/nextjs

# For React users (no Next.js)
npm install @carcosa/react

# For vanilla JS/other frameworks
npm install @carcosa/client

# Optional CLI
npm install -g @carcosa/cli
```

**Benefits**:
- Users only install what they need
- Smaller bundle sizes
- Clear separation of concerns

**Downsides**:
- More packages to maintain
- More confusing for users

---

## 🚀 Real-World User Workflow

### The Complete Journey

#### 1. Platform Sign-up & Setup

**User goes to carcosa.io (hosted platform):**

```
1. Sign up / Register
   ↓
2. Create Organization ("Acme Corp")
   ↓
3. Create Team ("Engineering")
   ↓
4. Connect Storage Bucket
   - Provider: Cloudflare R2
   - Access Key: xxx
   - Secret Key: xxx
   - Bucket Name: acme-uploads
   ↓
5. Create Project/App ("Production App")
   - Select bucket: acme-uploads
   - Generates: APP_SECRET = "cs_live_abc123..."
   ↓
6. Copy APP_SECRET
```

#### 2. Developer Integration in Their App

**In their Next.js app:**

```bash
# Install Carcosa
npm install carcosa
```

**`.env.local`:**
```bash
CARCOSA_SECRET=cs_live_abc123...
```

**`app/api/uploadthing/route.ts`:** (UploadThing-compatible route)
```typescript
import { createRouteHandler } from "carcosa/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

**`app/api/uploadthing/core.ts`:**
```typescript
import { createUploadRouter } from "carcosa/server";
import { auth } from "@/lib/auth";

const f = createUploadRouter({
  apiKey: process.env.CARCOSA_SECRET,
});

export const ourFileRouter = {
  imageUploader: f
    .image({ maxFileSize: "4MB" })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Save to database
      await db.userImages.create({
        data: {
          userId: metadata.userId,
          url: file.url,
        },
      });
    }),
};

export type OurFileRouter = typeof ourFileRouter;
```

**`components/UploadButton.tsx`:** (Client component)
```typescript
"use client";

import { UploadButton } from "carcosa/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function MyUploadButton() {
  return (
    <UploadButton<OurFileRouter>
      endpoint="imageUploader"
      onUploadComplete={(files) => {
        console.log("Uploaded files:", files);
        alert("Upload complete!");
      }}
    />
  );
}
```

**Using the image component:**
```typescript
import { Cmage } from "carcosa/react";

export function UserAvatar({ imageUrl }: { imageUrl: string }) {
  return (
    <Cmage
      src={imageUrl}
      width={200}
      height={200}
      alt="User avatar"
      // Automatic transformations via Carcosa
    />
  );
}
```

---

## 📦 Recommended Package Consolidation

### Publish These Packages

#### 1. **`carcosa`** (Main Package) - All-in-one

**Exports:**
```typescript
// Server exports
export { createUploadRouter, createRouteHandler } from "./server";

// Client exports
export { CarcosaClient } from "./client";

// React exports
export { UploadButton, UploadDropzone, Cmage, useUpload } from "./react";

// Next.js exports
export { createRouteHandler } from "./next";
```

**Package structure:**
```
carcosa/
├── server/      # Server utilities (file-router)
├── client/      # Client SDK
├── react/       # React components and hooks
└── next/        # Next.js utilities
```

**Installation:**
```bash
npm install carcosa
```

**Usage:**
```typescript
// Server
import { createUploadRouter } from "carcosa/server";

// Client
import { CarcosaClient } from "carcosa/client";

// React
import { UploadButton } from "carcosa/react";

// Next.js
import { createRouteHandler } from "carcosa/next";
```

#### 2. **`@carcosa/cli`** (Optional CLI)

**Installation:**
```bash
npm install -g @carcosa/cli
```

**Usage:**
```bash
carcosa login
carcosa upload ./image.jpg --project prod-app
carcosa files list --project prod-app
```

### Don't Publish These (Internal)

- `@carcosa/database` - Platform database schema
- `@carcosa/storage` - Platform storage adapters
- `@carcosa/ui` - Dashboard components
- `@carcosa/prisma-adapter` - NextAuth adapter (keep internal or optional)
- `@carcosa/types` - Merge into main package
- Config packages - Keep internal

---

## 🔄 Migration Plan

### Phase 1: Consolidate Into One Package

```bash
# Create main package
packages/carcosa/
├── src/
│   ├── server/
│   │   ├── index.ts          # Export createUploadRouter, f
│   │   └── file-router.ts    # From @carcosa/file-router
│   ├── client/
│   │   ├── index.ts          # Export CarcosaClient
│   │   └── sdk.ts            # From @carcosa/sdk
│   ├── react/
│   │   ├── index.ts          # Export components/hooks
│   │   ├── UploadButton.tsx  # From file-router
│   │   ├── Cmage.tsx         # From @carcosa/cmage
│   │   └── hooks.ts          # useUpload, etc.
│   └── next/
│       ├── index.ts          # Export createRouteHandler
│       └── route-handler.ts  # From @carcosa/nextjs
├── package.json
└── tsconfig.json
```

### Phase 2: Update Documentation

**Before:**
```bash
npm install @carcosa/file-router @carcosa/sdk @carcosa/cmage @carcosa/nextjs
```

**After:**
```bash
npm install carcosa
```

### Phase 3: Publish

```bash
cd packages/carcosa
npm version 1.0.0
npm publish
```

---

## 🎨 What the Developer Experience Looks Like

### UploadThing (Current)

```typescript
// Install
npm install uploadthing

// Server
import { createUploadthing } from "uploadthing/server";
const f = createUploadthing();

// Client
import { UploadButton } from "uploadthing/client";
```

### Carcosa (Proposed - Same Experience!)

```typescript
// Install
npm install carcosa

// Server
import { createUploadRouter } from "carcosa/server";
const f = createUploadRouter();

// Client
import { UploadButton } from "carcosa/react";
```

**Identical API, but:**
- ✅ Self-hosted
- ✅ BYOS (your own R2/S3)
- ✅ Multi-tenancy
- ✅ No vendor lock-in

---

## 🔑 API Key / Secret Flow

### What Developers Get

When they create a project on Carcosa dashboard, they get:

**API Secret:**
```
CARCOSA_SECRET=cs_live_8d7f9a2e1c3b4a5f6d7e8f9a0b1c2d3e
```

This secret:
- ✅ Authenticates their app to Carcosa platform
- ✅ Identifies which project/bucket to use
- ✅ Scoped to specific project
- ✅ Can be rotated anytime

### How It's Used

**In their code:**
```typescript
// Automatically reads from env
const f = createUploadRouter({
  apiKey: process.env.CARCOSA_SECRET,
});
```

**Behind the scenes:**
1. Developer's app → Calls Carcosa API with `CARCOSA_SECRET`
2. Carcosa validates secret → Identifies project
3. Carcosa gets project's bucket credentials from database
4. Carcosa generates presigned URL using user's R2/S3 credentials
5. Developer's app → Uploads directly to user's R2/S3
6. Callback to Carcosa → File metadata saved

**User's S3/R2 credentials never leave Carcosa platform!**

---

## 📊 Comparison with UploadThing

### UploadThing Packages

```
uploadthing/          # Main package
  - server
  - client
  - react
  - next

@uploadthing/react    # Separate React package (deprecated)
```

They consolidated into ONE package: `uploadthing`

### Carcosa Should Do The Same

```
carcosa/              # Main package (like uploadthing)
  - server
  - client
  - react
  - next

@carcosa/cli          # Separate CLI tool
```

**Benefits:**
- Simpler for developers (one install)
- Easier to maintain (one package)
- Smaller bundle (tree-shaking works)
- Less confusion (no version mismatches)

---

## ✅ Final Recommendation

### Publish Structure

**For Developers:**
```bash
npm install carcosa         # All-in-one package
npm install -g @carcosa/cli # Optional CLI
```

**Internal (Not Published):**
- `@carcosa/database` - Platform database
- `@carcosa/storage` - Platform storage
- `@carcosa/ui` - Dashboard UI
- Config packages

### Developer Workflow (End-to-End)

1. **Sign up on carcosa.io**
2. **Connect R2/S3 bucket**
3. **Create project → Get secret**
4. **`npm install carcosa`**
5. **Add secret to `.env`**
6. **Create upload route** (like UploadThing)
7. **Use `<UploadButton>` in React**
8. **Done!**

### Key Points

✅ **One main package** (`carcosa`) with subpath exports
✅ **UploadThing-compatible API** (easy migration)
✅ **Simple installation** (one npm install)
✅ **API secret** authenticates to platform
✅ **BYOS** - files go to user's S3/R2, not Carcosa's storage

---

## 🚀 Next Steps

1. **Create consolidated package** (`packages/carcosa/`)
2. **Move code** from file-router, sdk, cmage, nextjs
3. **Update imports** throughout codebase
4. **Test** developer experience
5. **Update docs** with new install instructions
6. **Publish to npm**

**Want me to start consolidating the packages into one main `carcosa` package?**
