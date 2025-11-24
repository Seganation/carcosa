# Prompt for Claude Code Web

**Copy and paste this entire prompt to Claude Code Web to continue implementation**

---

## Context

This is **Carcosa** - a self-hosted, BYOS (Bring Your Own Storage) file upload platform, similar to UploadThing but with complete control over storage infrastructure.

**Current Status**: ~75% complete, ready for final implementation push

**Project Location**: `/Users/rawa/dev/carcosa`

---

## Project Overview

Carcosa is a developer-first media control plane that allows developers to:
- Use their own S3/R2 storage (BYOS architecture)
- Get UploadThing-like developer experience
- Self-host everything
- No vendor lock-in

**Key Architecture:**
- **Backend**: Express API with 17 endpoint groups
- **Frontend**: Next.js 15 dashboard with 15+ pages
- **Database**: PostgreSQL with Prisma
- **Storage**: User-provided S3/R2 (credentials encrypted in database)
- **Monorepo**: Turborepo + npm workspaces

---

## Important Documents (READ THESE FIRST)

**Essential Files:**
1. `/README.md` - Complete project documentation
2. `/CLAUDE.md` - AI assistant guide with architecture details
3. `/IMPLEMENTATION-ROADMAP.md` - **MASTER PLAN** with phases, testing, workflows
4. `/docs/CLEANUP-SUMMARY.md` - What was just cleaned up
5. `/docs/PACKAGE-STRATEGY.md` - Package consolidation strategy
6. `/docs/BYOS-ARCHITECTURE-UPDATE.md` - BYOS architecture explanation

**Key Points:**
- ✅ Backend API 85% complete (17 route groups, 11 services)
- ✅ Database schema 90% complete
- ✅ Frontend 60% complete (display works, CRUD incomplete)
- 🚧 Zero tests currently
- 🚧 Build system has errors (turbo.json)
- 🚧 Package consolidation needed

---

## What Was Just Done (Previous Session)

### 1. Environment Variables Cleaned
- ❌ Removed all R2/S3 credentials from `.env.example`
- ✅ Updated to BYOS architecture (users provide storage via dashboard)
- ✅ Only platform credentials needed (DATABASE_URL, CREDENTIALS_ENCRYPTION_KEY, etc.)

### 2. Documentation Organized
- ✅ Only 3 MD files in root: README.md, CLAUDE.md, IMPLEMENTATION-ROADMAP.md
- ✅ All other docs moved to `/docs/` with proper categorization
- ✅ Created comprehensive implementation roadmap

### 3. Packages Cleaned
- ✅ Archived `cli` and `prisma-adapter` for later
- ✅ 10 active packages remain
- 🎯 Need to consolidate into one main `carcosa` package (like UploadThing)

---

## Your Mission: Complete the Implementation

Follow **`/IMPLEMENTATION-ROADMAP.md`** which has 4 phases over 6-8 weeks:

### Phase 1: Foundation & Testing (Week 1-2) 🔴 START HERE

**Priority tasks:**

#### 1. Fix Build System (Day 1)
- [ ] Fix turbo.json dependency errors
- [ ] Ensure `npm run build` completes successfully
- [ ] Test `npm run dev` starts all services
- [ ] Verify API (http://localhost:4000) and Web (http://localhost:3000) work

**Current Issue:**
```bash
npm run build
# Error: Could not find "@repo/typescript-config#build" in root turbo.json
```

**Fix needed:** Update turbo.json dependencies

#### 2. Setup Testing Infrastructure (Day 2-3)
- [ ] Install Jest or Vitest
- [ ] Create test setup (test database, fixtures)
- [ ] Write first unit test (e.g., health check endpoint)
- [ ] Add test scripts to package.json

**Goal:**
```bash
npm run test          # Should pass
npm run test:watch    # Should work
```

#### 3. Database Migrations (Day 4)
- [ ] Create proper migrations from Prisma schema
- [ ] Add strategic indexes (see DATABASE-OPTIMIZATION.md in docs/features/)
- [ ] Test migration deployment

**Commands:**
```bash
npm run --workspace @carcosa/database db:migrate
npm run --workspace @carcosa/database db:deploy
```

#### 4. Test Complete File Upload Flow (Day 5)
- [ ] Start infrastructure: `docker compose up -d postgres`
- [ ] Seed database: `npm run --workspace @carcosa/database db:seed`
- [ ] Open dashboard: http://localhost:3000
- [ ] Create: Organization → Team → Project → Add Bucket
- [ ] Upload a test file
- [ ] Verify file appears in R2/S3
- [ ] Test download via signed URL
- [ ] Test image transformation

**Success criteria:** End-to-end upload works!

---

## Phase 2: Frontend CRUD & Auth (Week 3)

### Tasks:
1. **Complete CRUD Operations** - Add edit/delete dialogs for:
   - Organizations
   - Teams
   - Projects
   - Buckets
   - API Keys
   - Tenants

2. **Fix Authentication Flow**
   - Decide: Keep NextAuth OR switch to Express-only auth
   - Wire up protected routes
   - Test login/logout

3. **Form Validation**
   - Add Zod validation to all forms
   - Add loading states
   - Add error states

---

## Phase 3: Package Consolidation (Week 4)

### Goal: One `carcosa` package (like UploadThing)

**Current packages to consolidate:**
- `file-router` → `carcosa/server`
- `sdk` → `carcosa/client`
- `cmage` → `carcosa/react`
- `nextjs` → `carcosa/next`

**Result:**
```bash
# Instead of multiple installs
npm install @carcosa/file-router @carcosa/sdk @carcosa/cmage

# Just one install
npm install carcosa
```

**See `/docs/PACKAGE-STRATEGY.md` for detailed plan**

---

## Phase 4: Testing & Production (Week 5-8)

### Testing Strategy (60% unit, 30% integration, 10% E2E):

**Unit Tests** (60%):
- Services (storage, projects, buckets, etc.)
- Utilities (crypto, validation)
- Middleware (auth, rate limiting)

**Integration Tests** (30%):
- API endpoints (17 route groups)
- Database operations
- Authentication flow

**E2E Tests** (10%):
- Complete workflows
- File upload flow
- Dashboard interactions

**See detailed testing strategy in IMPLEMENTATION-ROADMAP.md**

---

## Key Architecture Details

### BYOS (Bring Your Own Storage)

**How it works:**
1. User provides S3/R2 credentials via dashboard
2. Credentials encrypted with `CREDENTIALS_ENCRYPTION_KEY` (libsodium)
3. Stored in database `Bucket` table
4. Decrypted on-demand for file operations
5. Files upload directly to user's storage

**Flow:**
```
Developer App → Carcosa API (with app secret) →
Validate → Get bucket from DB → Decrypt credentials →
Generate presigned URL → Return to developer →
Developer uploads directly to their R2/S3
```

**User never needs R2/S3 in environment variables!**

### Multi-Tenancy Hierarchy

```
Organization
├── Teams
│   ├── Buckets (with encrypted credentials)
│   └── Projects
│       ├── API Keys (17 permission types)
│       ├── Files
│       ├── Tenants (optional multi-tenant isolation)
│       └── Transforms
```

### User Workflow (Sign-up to Upload)

**See complete workflow in IMPLEMENTATION-ROADMAP.md**

Summary:
1. User signs up on Carcosa
2. Creates Org → Team → Connects Bucket (enters R2 credentials)
3. Creates Project → Gets API secret: `cs_live_abc123...`
4. In their app: `npm install carcosa`
5. Add `.env`: `CARCOSA_SECRET=cs_live_abc123...`
6. Create upload route (UploadThing-compatible API)
7. Use `<UploadButton>` component
8. Done!

---

## Testing Requirements

### Must Have Tests For:

**API Endpoints (17 groups):**
- auth, organizations, teams, projects, buckets
- api-keys, files, uploads, transforms, tenants
- tokens, usage, audit-logs, rate-limits, settings

**Critical Flows:**
- File upload (init → upload → complete)
- Authentication (login → protected route → logout)
- Bucket management (create → share → rotate credentials)
- Multi-tenancy (create tenant → upload to tenant → list files)

**Pre-Production Checks:**
```bash
npm run build          # Must pass
npm run lint           # Must pass
npm run check-types    # Must pass
npm run test           # Must pass (70%+ coverage)
npm run test:e2e       # Critical flows pass
```

---

## Project Structure

```
carcosa/
├── apps/
│   ├── api/               # Express API (17 routes, 11 services)
│   └── web/carcosa/       # Next.js dashboard (15+ pages)
│
├── packages/
│   ├── file-router/       # Upload router (to consolidate)
│   ├── sdk/               # Client SDK (to consolidate)
│   ├── cmage/             # Image component (to consolidate)
│   ├── nextjs/            # Next.js utils (to consolidate)
│   ├── database/          # Prisma schema (keep internal)
│   ├── storage/           # S3/R2 adapters (keep internal)
│   └── ...
│
├── docs/                  # Organized documentation
├── README.md              # Project overview
├── CLAUDE.md              # AI guide
└── IMPLEMENTATION-ROADMAP.md  # ⭐ MASTER PLAN
```

---

## Important Commands

```bash
# Development
npm install
npm run build
npm run dev

# Database
npm run --workspace @carcosa/database db:generate
npm run --workspace @carcosa/database db:push
npm run --workspace @carcosa/database db:migrate
npm run --workspace @carcosa/database db:seed

# Infrastructure
docker compose up -d postgres                # Minimal
docker compose --profile redis up -d         # With Redis
docker compose --profile full up -d          # Everything

# Testing (after setup)
npm run test
npm run test:watch
npm run test:coverage
npm run lint
npm run check-types
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ `npm run build` works
- ✅ Tests run successfully
- ✅ Database migrations created
- ✅ File upload works end-to-end

### Production Ready When:
- ✅ All tests passing (70%+ coverage)
- ✅ All CRUD operations complete
- ✅ Authentication working
- ✅ Package consolidated
- ✅ Documentation complete
- ✅ Security audit done
- ✅ Performance optimized

---

## Questions You Might Have

**Q: Where should I start?**
A: Phase 1, Task 1 - Fix the build system. See IMPLEMENTATION-ROADMAP.md

**Q: What's the priority?**
A: 1) Fix build 2) Setup tests 3) Test file upload 4) Complete CRUD

**Q: Should I keep NextAuth or switch to Express auth?**
A: Your choice, but document the decision. See pros/cons in IMPLEMENTATION-ROADMAP.md

**Q: When should I consolidate packages?**
A: After Phase 1-2 are complete. See PACKAGE-STRATEGY.md for detailed plan.

**Q: How do I test file uploads?**
A: Use real R2/S3 credentials in dashboard. Full workflow in IMPLEMENTATION-ROADMAP.md

---

## Important Notes

### BYOS Architecture
- ❌ Platform does NOT need storage credentials in env
- ✅ Users provide credentials via dashboard
- ✅ Credentials encrypted in database
- ✅ Files upload directly to user's storage

### Package Strategy
- 🎯 Goal: One main `carcosa` package
- 📦 Internal packages stay internal (database, storage, ui)
- 🚀 Developer installs: `npm install carcosa`

### Testing Philosophy
- 60% unit tests (fast, focused)
- 30% integration tests (API endpoints)
- 10% E2E tests (critical workflows)

---

## Your Action Items (Start Here!)

### Today:
1. Read `/IMPLEMENTATION-ROADMAP.md` (15 min)
2. Fix turbo.json build errors (1-2 hours)
3. Get `npm run build` working
4. Test `npm run dev` starts services

### This Week:
1. Setup Jest/Vitest
2. Write first 10 tests
3. Create database migrations
4. Test file upload end-to-end

### This Month:
1. Complete all CRUD operations
2. Fix authentication
3. Consolidate packages
4. Reach 70%+ test coverage

---

## Timeline

- **Week 1-2**: Foundation (build, tests, migrations)
- **Week 3**: CRUD & Auth
- **Week 4**: Package consolidation
- **Week 5-8**: Testing, security, production prep

**Total: 6-8 weeks to production-ready platform**

---

## Final Notes

### What's Working:
- ✅ 75% of code complete
- ✅ Solid architecture
- ✅ BYOS system implemented
- ✅ Multi-tenancy working
- ✅ Rate limiting advanced

### What's Needed:
- 🚧 Tests (critical!)
- 🚧 CRUD completion
- 🚧 Package consolidation
- 🚧 Documentation polish

### You Have:
- Complete implementation roadmap
- Testing strategy
- Package consolidation plan
- User workflow documented
- Production checklist

**Everything is ready for the final push! Follow IMPLEMENTATION-ROADMAP.md phase by phase.** 🚀

---

## Questions or Issues?

- Check `/IMPLEMENTATION-ROADMAP.md` first
- Check `/CLAUDE.md` for architecture details
- Check `/docs/` for specific documentation
- Reference `/README.md` for quick overview

**Good luck! The foundation is solid - now finish strong!** 💪
