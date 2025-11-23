# Migration Guide: Adding Carcosa Tenant Management

This guide will help you migrate your existing application to use Carcosa's tenant management system.

## Prerequisites

- Your app uses Prisma as the ORM
- You have a Carcosa account and project
- You have existing tenant/organization/workspace models

## Step 1: Install the Adapter

```bash
npm install @carcosa/prisma-adapter
```

## Step 2: Update Your Prisma Schema

Add the required Carcosa fields to your existing tenant model:

```prisma
// Before
model Tenant {
  id       String   @id @default(cuid())
  name     String
  slug     String   @unique
  plan     String
  // ... other fields
}

// After
model Tenant {
  id         String   @id @default(cuid())
  carcosaId  String?  @unique // Carcosa tenant ID
  name       String
  slug       String   @unique
  plan       String
  metadata   Json?    // Carcosa metadata
  lastSynced DateTime? // Last sync timestamp
  // ... other fields
  
  @@index([carcosaId])
  @@index([slug])
}
```

## Step 3: Run Database Migration

```bash
npx prisma migrate dev --name add-carcosa-tenant-fields
```

## Step 4: Initialize the Adapter

```typescript
// lib/carcosa.ts
import { PrismaClient } from '@prisma/client';
import { CarcosaTenantAdapter } from '@carcosa/prisma-adapter';

const prisma = new PrismaClient();

export const carcosaAdapter = new CarcosaTenantAdapter(prisma, {
  projectId: process.env.CARCOSA_PROJECT_ID!,
  apiKey: process.env.CARCOSA_API_KEY!,
  autoSync: true
});
```

## Step 5: Add Environment Variables

```env
# .env
CARCOSA_PROJECT_ID=your-project-id
CARCOSA_API_KEY=your-api-key
CARCOSA_API_URL=https://api.carcosa.dev
```

## Step 6: Update Your Code

### Replace Manual Tenant Lookups

```typescript
// Before
const tenant = await prisma.tenant.findFirst({
  where: { slug: req.headers['x-tenant'] }
});

// After
const tenant = await carcosaAdapter.getTenantFromRequest(req);
```

### Add Middleware

```typescript
// middleware/tenant.ts
import { carcosaTenantMiddleware } from '@carcosa/prisma-adapter';

export default carcosaTenantMiddleware(carcosaAdapter);
```

## Step 7: First Sync

Run the initial sync to populate your database with existing Carcosa tenants:

```typescript
// scripts/sync-tenants.ts
import { carcosaAdapter } from '../lib/carcosa';

async function syncTenants() {
  try {
    const result = await carcosaAdapter.syncTenants();
    console.log('Sync result:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

syncTenants();
```

## Step 8: Test and Deploy

1. Test locally with a few tenants
2. Verify tenant detection works correctly
3. Deploy to staging environment
4. Run full sync in staging
5. Deploy to production
6. Run full sync in production

## Common Migration Patterns

### Pattern 1: Gradual Migration

Keep both systems running during transition:

```typescript
// Support both old and new tenant systems
const tenant = await carcosaAdapter.getTenantFromRequest(req) 
  || await getLegacyTenant(req);

if (tenant?.carcosaId) {
  // New Carcosa tenant
  console.log('Using Carcosa tenant:', tenant.carcosaId);
} else {
  // Legacy tenant
  console.log('Using legacy tenant:', tenant?.id);
}
```

### Pattern 2: Subdomain Migration

If you're moving from path-based to subdomain-based routing:

```typescript
// Before: /api/tenant/123/data
// After: 123.api.yourdomain.com/api/data

// Update your DNS and routing configuration
// The adapter will automatically detect subdomains
```

### Pattern 3: Header-Based Migration

If you're moving from query params to headers:

```typescript
// Before: ?tenant=123
// After: X-Tenant-Slug: 123

// Update your frontend to send headers instead of query params
```

## Troubleshooting

### Sync Issues

- **401 errors**: Check your API key and project ID
- **404 errors**: Verify the project exists in Carcosa
- **Rate limiting**: Adjust sync intervals

### Tenant Detection Issues

- **Subdomains not working**: Check DNS configuration
- **Headers not detected**: Verify header names match
- **Custom detection failing**: Debug your custom logic

### Database Issues

- **Migration failures**: Check Prisma schema compatibility
- **Index issues**: Verify database indexes are created
- **Constraint violations**: Check for duplicate data

## Rollback Plan

If you need to rollback:

1. **Disable auto-sync**: Set `autoSync: false`
2. **Remove middleware**: Comment out tenant middleware
3. **Revert code changes**: Use git to revert changes
4. **Keep Carcosa fields**: Don't remove the database fields yet
5. **Test thoroughly**: Ensure everything works without Carcosa
6. **Remove fields later**: Once confident, remove Carcosa-specific fields

## Performance Considerations

- **Sync frequency**: Start with 5-minute intervals, adjust based on needs
- **Batch operations**: Consider batching database operations for large syncs
- **Caching**: Implement caching for frequently accessed tenant data
- **Monitoring**: Monitor sync performance and database load

## Security Considerations

- **API key rotation**: Regularly rotate your Carcosa API keys
- **Environment variables**: Never commit API keys to version control
- **Access control**: Ensure only authorized users can trigger syncs
- **Audit logging**: Log all tenant sync operations for compliance
