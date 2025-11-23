# Carcosa Implementation Roadmap

**Last Updated**: November 23, 2024
**Status**: 75% Complete → 100% Production Ready
**Timeline**: 6-8 weeks to full production

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [Package Structure](#package-structure)
3. [Implementation Phases](#implementation-phases)
4. [User Workflow](#user-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Production Checklist](#production-checklist)

---

## 🎯 Current State

### What's Working (75%)

**Backend API - 85%**
- ✅ 17 API route groups
- ✅ 11 service modules
- ✅ BYOS architecture (user-provided storage)
- ✅ Granular permissions (17 types)
- ✅ Rate limiting (6 tiers, in-memory)
- ✅ Image transformations (Sharp)
- ✅ Multi-tenant support
- ✅ Audit logging

**Database - 90%**
- ✅ Complete Prisma schema (15+ models)
- ✅ Hierarchical multi-tenancy
- ✅ Bucket sharing model
- ✅ Seed script
- 🚧 Need migrations (currently using db:push)
- 🚧 Need indexes for optimization

**Frontend - 60%**
- ✅ 15+ dashboard pages
- ✅ 7 core dialog components
- ✅ Display all entities
- 🚧 Edit/delete operations incomplete
- 🚧 Form validation needs work
- 🚧 Error/loading states missing

**Packages - 80%**
- ✅ file-router (95% - production ready)
- ✅ storage adapters (90%)
- ✅ database layer (90%)
- ✅ sdk (70%)
- ✅ nextjs utilities (70%)
- ✅ cmage component (80%)

### What's Missing (25%)

1. **Testing** - Zero tests currently
2. **Package consolidation** - Too many packages
3. **Frontend CRUD completion** - Edit/delete operations
4. **Authentication flow** - NextAuth not fully integrated
5. **Documentation** - API reference incomplete
6. **Production deployment** - No deployment guides

---

## 📦 Package Structure

### Current Packages (10 active)

**Developer-Facing:**
- `file-router` - Core upload system
- `sdk` - Client SDK
- `nextjs` - Next.js integration
- `cmage` - React image component

**Internal/Platform:**
- `database` - Prisma schema
- `storage` - S3/R2 adapters
- `types` - Shared TypeScript types
- `ui` - Dashboard components

**Config:**
- `eslint-config` - Shared ESLint config
- `typescript-config` - Shared TypeScript config

**Archived (for later):**
- `_archived-cli` - CLI tool (deferred)
- `_archived-prisma-adapter` - NextAuth adapter (deferred)

### Target Package Structure

**Goal**: Consolidate into ONE main package for developers

```
packages/
├── carcosa/              # 🎯 NEW: All-in-one developer package
│   ├── server/           # Upload router (from file-router)
│   ├── client/           # Client SDK (from sdk)
│   ├── react/            # Components (from cmage + file-router)
│   └── next/             # Next.js utilities (from nextjs)
│
├── database/             # Internal: Platform database
├── storage/              # Internal: Platform storage
├── types/                # Internal: Shared types
├── ui/                   # Internal: Dashboard UI
└── config/               # Internal: ESLint/TS configs
```

**Developer installation:**
```bash
npm install carcosa
```

**Usage:**
```typescript
import { createUploadRouter } from "carcosa/server";
import { UploadButton } from "carcosa/react";
import { CarcosaClient } from "carcosa/client";
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Testing (Week 1-2)

**Goal**: Get it working and tested

#### 1.1 Fix Build System (Day 1)
- [ ] Fix turbo.json dependency errors
- [ ] Ensure all packages build successfully
- [ ] Test `npm run build` completes without errors
- [ ] Test `npm run dev` starts all services

**Test:**
```bash
npm run build
npm run dev
# Verify API: http://localhost:4000
# Verify Web: http://localhost:3000
```

#### 1.2 Setup Testing Infrastructure (Day 2-3)
- [ ] Install Jest/Vitest
- [ ] Setup test configuration
- [ ] Create test utilities (test database, fixtures)
- [ ] Write first test (health check endpoint)

**File structure:**
```
apps/api/
├── src/
└── tests/
    ├── setup.ts
    ├── fixtures/
    ├── unit/
    └── integration/
```

**Test script:**
```bash
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:int      # Integration tests only
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

#### 1.3 Database Migrations (Day 4)
- [ ] Create proper migrations from schema
- [ ] Add strategic indexes
- [ ] Migration deployment script
- [ ] Test migrations on clean database

**Commands:**
```bash
# Create migration
npm run --workspace @carcosa/database db:migrate

# Deploy migrations (production)
npm run --workspace @carcosa/database db:deploy

# Reset database (dev only)
npm run --workspace @carcosa/database db:reset
```

#### 1.4 Test File Upload Flow (Day 5)
- [ ] Create organization → team → project
- [ ] Add bucket (real R2 credentials)
- [ ] Upload file via dashboard
- [ ] Verify file appears in R2
- [ ] Download file via signed URL
- [ ] Test image transformation

**E2E test script:**
```typescript
// tests/e2e/upload-flow.test.ts
test('complete upload flow', async () => {
  // 1. Create org/team/project
  const project = await createTestProject();

  // 2. Add bucket
  const bucket = await addTestBucket(project.teamId);

  // 3. Upload file
  const upload = await initiateUpload({
    projectId: project.id,
    fileName: 'test.jpg',
  });

  // 4. Verify file uploaded
  const file = await getFile(upload.fileId);
  expect(file).toBeDefined();

  // 5. Download file
  const downloadUrl = await getSignedUrl(file.id);
  expect(downloadUrl).toContain('https://');
});
```

### Phase 2: Frontend CRUD & Authentication (Week 3)

**Goal**: Complete all CRUD operations and auth flow

#### 2.1 Complete CRUD Operations (Day 1-3)
- [ ] **Organizations**: Add edit dialog + API integration
- [ ] **Teams**: Add edit dialog + member management
- [ ] **Projects**: Add edit dialog + settings
- [ ] **Buckets**: Add edit dialog + credential rotation
- [ ] **API Keys**: Add edit dialog + permission management
- [ ] **Tenants**: Add edit/delete operations
- [ ] Add delete confirmations for all entities
- [ ] Add form validation (Zod)
- [ ] Add loading states
- [ ] Add error states

**Component structure:**
```typescript
// Example: Edit Organization Dialog
<EditOrganizationDialog
  organizationId={org.id}
  onSuccess={() => {
    toast.success("Organization updated");
    refetch();
  }}
/>
```

#### 2.2 Authentication Flow (Day 4-5)
**Decision**: Keep NextAuth or switch to Express-only?

**Option A: Keep NextAuth (Faster)**
- [ ] Wire up NextAuth fully
- [ ] Add protected route middleware
- [ ] Test login/logout flow
- [ ] Add session management

**Option B: Express-only Auth (Better long-term)**
- [ ] Implement Express auth endpoints
- [ ] Create login/register pages
- [ ] Add JWT token management
- [ ] Remove NextAuth dependencies

**Auth endpoints:**
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
```

### Phase 3: Package Consolidation (Week 4)

**Goal**: One `carcosa` package for developers

#### 3.1 Create Main Package (Day 1-2)
- [ ] Create `packages/carcosa/` directory
- [ ] Setup package.json with subpath exports
- [ ] Move file-router code to `carcosa/server`
- [ ] Move sdk code to `carcosa/client`
- [ ] Move cmage + components to `carcosa/react`
- [ ] Move nextjs utilities to `carcosa/next`

**Package.json exports:**
```json
{
  "name": "carcosa",
  "version": "1.0.0",
  "exports": {
    "./server": "./dist/server/index.js",
    "./client": "./dist/client/index.js",
    "./react": "./dist/react/index.js",
    "./next": "./dist/next/index.js"
  }
}
```

#### 3.2 Update Documentation (Day 3)
- [ ] Update README with new install instructions
- [ ] Create migration guide from old packages
- [ ] Update code examples
- [ ] Create integration guides

**New install:**
```bash
# Old (multiple packages)
npm install @carcosa/file-router @carcosa/sdk @carcosa/cmage

# New (one package)
npm install carcosa
```

#### 3.3 Test Example App (Day 4-5)
- [ ] Create example Next.js app
- [ ] Test complete integration
- [ ] Document common patterns
- [ ] Test with real R2 bucket

---

## 👤 User Workflow

### Complete User Journey (From Sign-up to Working Upload)

#### Step 1: Platform Sign-up

**User goes to carcosa.io:**

```
1. Register/Sign up
   ↓
2. Create Organization
   - Name: "Acme Corp"
   - Slug: acme-corp
   ↓
3. Create Team
   - Name: "Engineering"
   - Organization: Acme Corp
   ↓
4. Connect Storage Bucket
   - Provider: Cloudflare R2
   - Bucket Name: acme-uploads
   - Account ID: [from R2 dashboard]
   - Access Key: [from R2 dashboard]
   - Secret Key: [from R2 dashboard]
   - Region: auto
   ↓ (Carcosa encrypts credentials and stores in database)

5. Create Project
   - Name: "Production App"
   - Team: Engineering
   - Bucket: acme-uploads
   ↓ (Carcosa generates API secret)

6. Copy API Secret
   📋 CARCOSA_SECRET=cs_live_abc123xyz...
```

#### Step 2: Developer Integration

**In their Next.js app:**

```bash
cd my-nextjs-app
npm install carcosa
```

**Create `.env.local`:**
```bash
CARCOSA_SECRET=cs_live_abc123xyz...
```

**Create upload route** (`app/api/uploadthing/route.ts`):
```typescript
import { createRouteHandler } from "carcosa/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

**Define file router** (`app/api/uploadthing/core.ts`):
```typescript
import { createUploadRouter } from "carcosa/server";

const f = createUploadRouter({
  apiKey: process.env.CARCOSA_SECRET,
});

export const ourFileRouter = {
  imageUploader: f
    .image({ maxFileSize: "4MB" })
    .middleware(async ({ req }) => {
      // Your auth logic
      const user = await getUser(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Save to your database
      await db.images.create({
        data: {
          userId: metadata.userId,
          url: file.url,
          name: file.name,
        },
      });
    }),
};

export type OurFileRouter = typeof ourFileRouter;
```

**Use in component** (`components/UploadButton.tsx`):
```typescript
"use client";
import { UploadButton } from "carcosa/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function MyUpload() {
  return (
    <UploadButton<OurFileRouter>
      endpoint="imageUploader"
      onUploadComplete={(files) => {
        console.log("Uploaded:", files);
      }}
    />
  );
}
```

**Display images** with automatic transforms:
```typescript
import { Cmage } from "carcosa/react";

<Cmage
  src={imageUrl}
  width={400}
  height={300}
  alt="User upload"
/>
```

#### Behind the Scenes Flow

```
Developer's App          Carcosa Platform           User's R2
     │                          │                       │
     │  1. Init upload          │                       │
     │  (CARCOSA_SECRET)        │                       │
     ├─────────────────────────>│                       │
     │                          │                       │
     │                          │  2. Validate secret   │
     │                          │     Get project       │
     │                          │     Get bucket        │
     │                          │     Decrypt R2 creds  │
     │                          │                       │
     │  3. Presigned URL        │                       │
     │<─────────────────────────┤                       │
     │                          │                       │
     │  4. Upload directly      │                       │
     ├──────────────────────────┼──────────────────────>│
     │                          │                       │
     │  5. Notify complete      │                       │
     ├─────────────────────────>│                       │
     │                          │  6. Save metadata     │
     │                          │     Trigger callback  │
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```
           /\
          /E2E\        E2E Tests (10%)
         /------\
        /  Int   \     Integration Tests (30%)
       /----------\
      /    Unit    \   Unit Tests (60%)
     /--------------\
```

### Unit Tests (60% coverage)

**What to test:**
- Individual functions
- Service methods
- Utility functions
- Validation schemas

**Location:** `apps/api/tests/unit/`

**Example:**
```typescript
// tests/unit/services/storage.test.ts
describe('StorageService', () => {
  describe('getAdapterForProject', () => {
    it('should return R2 adapter for R2 bucket', async () => {
      const adapter = await getAdapterForProject('project-id');
      expect(adapter).toBeInstanceOf(R2Adapter);
    });

    it('should decrypt credentials correctly', async () => {
      const adapter = await getAdapterForProject('project-id');
      expect(adapter.credentials).toBeDefined();
    });
  });
});
```

### Integration Tests (30% coverage)

**What to test:**
- API endpoints
- Database operations
- Full request/response cycle
- Authentication flow

**Location:** `apps/api/tests/integration/`

**Example:**
```typescript
// tests/integration/api/projects.test.ts
describe('POST /api/v1/projects', () => {
  it('should create project with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project',
        teamId: 'team-123',
        bucketId: 'bucket-123',
      });

    expect(response.status).toBe(201);
    expect(response.body.project).toBeDefined();
  });

  it('should reject without auth', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({});

    expect(response.status).toBe(401);
  });
});
```

### E2E Tests (10% coverage)

**What to test:**
- Complete user workflows
- File upload flow
- Dashboard interactions
- Multi-step processes

**Location:** `apps/web/carcosa/tests/e2e/`

**Tool:** Playwright or Cypress

**Example:**
```typescript
// tests/e2e/upload-flow.spec.ts
test('user can upload file', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  // 2. Navigate to project
  await page.goto('/dashboard/app/project-123');

  // 3. Upload file
  await page.setInputFiles('input[type=file]', 'test-image.jpg');
  await page.click('button:has-text("Upload")');

  // 4. Wait for upload
  await page.waitForSelector('.upload-success');

  // 5. Verify file appears
  await expect(page.locator('.file-list')).toContainText('test-image.jpg');
});
```

### Test Scripts

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:int",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:int": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Continuous Integration Tests

**GitHub Actions** (`.github/workflows/test.yml`):
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build packages
        run: npm run build

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run check-types

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:int
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test
```

### Pre-Production Test Checklist

Before deploying to production, run:

```bash
#!/bin/bash
# scripts/pre-production-check.sh

echo "🔍 Running pre-production checks..."

# 1. Build check
echo "1. Building project..."
npm run build || exit 1

# 2. Lint check
echo "2. Running linter..."
npm run lint || exit 1

# 3. Type check
echo "3. Checking types..."
npm run check-types || exit 1

# 4. Unit tests
echo "4. Running unit tests..."
npm run test:unit || exit 1

# 5. Integration tests
echo "5. Running integration tests..."
npm run test:int || exit 1

# 6. E2E tests
echo "6. Running E2E tests..."
npm run test:e2e || exit 1

# 7. Security audit
echo "7. Security audit..."
npm audit --audit-level=high || exit 1

# 8. Bundle size check
echo "8. Checking bundle sizes..."
npm run analyze

echo "✅ All checks passed!"
```

---

## ✅ Production Checklist

### Pre-Launch Checklist

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passing with zero errors
- [ ] Code formatted (Prettier)
- [ ] No console.logs in production code
- [ ] No TODO comments in critical paths

#### Testing
- [ ] Unit test coverage > 60%
- [ ] Integration tests passing
- [ ] E2E tests for critical flows
- [ ] Load testing completed
- [ ] All tests passing in CI/CD

#### Security
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] Encryption keys backed up
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Rate limiting tested
- [ ] CORS configured correctly
- [ ] Security headers added
- [ ] Dependency audit clean (npm audit)

#### Database
- [ ] Migrations created and tested
- [ ] Indexes added for performance
- [ ] Backup strategy in place
- [ ] Rollback strategy documented

#### Performance
- [ ] API response times < 200ms
- [ ] Database queries optimized
- [ ] Images cached via CDN
- [ ] Bundle sizes optimized
- [ ] Lighthouse score > 90

#### Documentation
- [ ] README.md complete
- [ ] API reference complete
- [ ] Integration guide complete
- [ ] Troubleshooting guide complete
- [ ] Self-hosting guide complete

#### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Log aggregation (DataDog/CloudWatch)
- [ ] Uptime monitoring
- [ ] Alert system configured

#### Deployment
- [ ] Production environment setup
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] Backup system tested
- [ ] Rollback procedure tested

---

## 📅 Timeline Summary

### Week 1-2: Foundation
- Fix build system
- Setup testing
- Database migrations
- Test file upload flow

### Week 3: CRUD & Auth
- Complete frontend CRUD
- Fix authentication
- Add validation

### Week 4: Package Consolidation
- Create main `carcosa` package
- Update documentation
- Test example app

### Week 5-6: Testing & Polish
- Write unit tests
- Write integration tests
- E2E tests
- Performance optimization

### Week 7-8: Production Prep
- Security audit
- Documentation complete
- Deployment guides
- Final testing
- Launch! 🚀

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ Build time < 2 minutes
- ✅ Test coverage > 70%
- ✅ API response time < 200ms
- ✅ Zero TypeScript errors
- ✅ Zero security vulnerabilities

### User Metrics
- ✅ Sign-up to first upload < 5 minutes
- ✅ Upload success rate > 99%
- ✅ Dashboard load time < 2 seconds
- ✅ Developer setup time < 10 minutes

---

## 📞 Support & Next Steps

### Immediate Next Steps (This Week)

1. **Fix build system** - Get `npm run build` working
2. **Test one complete flow** - Sign-up → Upload → Download
3. **Setup testing** - Install Jest and write first test
4. **Complete one CRUD** - Pick organization edit, complete it

### Questions to Resolve

- [ ] Keep NextAuth or switch to Express auth?
- [ ] When to consolidate packages?
- [ ] Which testing framework? (Jest vs Vitest)
- [ ] Which E2E tool? (Playwright vs Cypress)

---

**🚀 LET'S BUILD THIS! The foundation is solid. Now we finish strong.**

---

## Appendix: Quick Reference Commands

```bash
# Development
npm run dev                # Start dev servers
npm run build              # Build all packages
npm run lint               # Run ESLint
npm run check-types        # TypeScript check

# Database
npm run --workspace @carcosa/database db:generate  # Generate Prisma client
npm run --workspace @carcosa/database db:push      # Push schema (dev)
npm run --workspace @carcosa/database db:migrate   # Create migration
npm run --workspace @carcosa/database db:deploy    # Deploy migrations
npm run --workspace @carcosa/database db:seed      # Seed database

# Testing
npm run test               # Run all tests
npm run test:unit          # Unit tests
npm run test:int           # Integration tests
npm run test:e2e           # E2E tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Docker
docker compose up -d postgres                # Start Postgres only
docker compose --profile redis up -d         # Start with Redis
docker compose --profile full up -d          # Start everything
docker compose down                          # Stop all services

# Production
npm run --workspace @carcosa/database db:deploy    # Deploy migrations
npm run build                                       # Build for production
NODE_ENV=production npm start                      # Start production
```

---

**This is your master implementation guide. Follow it phase by phase, and you'll have a production-ready platform!**
