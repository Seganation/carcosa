# @carcosa/prisma-adapter

A Prisma adapter for seamless integration between your application's tenant model and Carcosa's tenant management system.

## Features

- 🔄 **Auto-sync**: Automatically sync tenants from Carcosa to your local database
- 🏷️ **Multi-source detection**: Detect tenants from subdomains, headers, or custom logic
- 📊 **Sync reporting**: Get detailed reports of sync operations
- ⚡ **Performance**: Efficient syncing with configurable intervals
- 🛡️ **Error handling**: Robust error handling and recovery

## Installation

```bash
npm install @carcosa/prisma-adapter
```

## Quick Start

### 1. Add Tenant Model to Your Schema

```prisma
// prisma/schema.prisma
model Tenant {
  id         String   @id @default(cuid())
  carcosaId  String?  @unique // Carcosa tenant ID
  slug       String   @unique // Tenant slug (e.g., subdomain)
  metadata   Json?    // Custom metadata
  lastSynced DateTime? // Last sync timestamp
  
  // Your existing tenant fields
  name       String?
  plan       String?
  settings   Json?
  
  // Your existing relations
  users      User[]
  projects   Project[]
  
  @@index([slug])
  @@index([carcosaId])
}
```

### 2. Initialize the Adapter

```typescript
import { PrismaClient } from '@prisma/client';
import { CarcosaTenantAdapter } from '@carcosa/prisma-adapter';

const prisma = new PrismaClient();

const adapter = new CarcosaTenantAdapter(prisma, {
  projectId: 'your-carcosa-project-id',
  apiKey: 'your-carcosa-api-key',
  apiUrl: 'https://api.carcosa.dev', // Optional, defaults to localhost:4000
  autoSync: true, // Enable automatic syncing
  syncInterval: 5 * 60 * 1000 // Sync every 5 minutes
});
```

### 3. Manual Sync

```typescript
// Sync tenants from Carcosa
const result = await adapter.syncTenants();
console.log(`Synced: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`);
```

### 4. Get Tenant Context

```typescript
// In your Express/Next.js middleware
app.use(async (req, res, next) => {
  const tenant = await adapter.getTenantFromRequest(req);
  if (tenant) {
    req.tenant = tenant;
  }
  next();
});

// Or manually by slug
const tenant = await adapter.getTenantBySlug('customer-name');
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | - | Your Carcosa project ID (required) |
| `apiKey` | string | - | Your Carcosa API key (required) |
| `apiUrl` | string | `http://localhost:4000` | Carcosa API base URL |
| `autoSync` | boolean | `false` | Enable automatic syncing |
| `syncInterval` | number | `300000` | Sync interval in milliseconds (5 min) |

## Advanced Usage

### Custom Tenant Detection

```typescript
// Override tenant detection logic
class CustomTenantAdapter extends CarcosaTenantAdapter {
  async getTenantFromRequest(req: any): Promise<TenantContext | null> {
    // Your custom logic here
    const tenantId = req.query.tenant || req.body.tenant;
    if (tenantId) {
      return this.getTenantBySlug(tenantId);
    }
    return null;
  }
}
```

### Webhook Integration

```typescript
// Handle Carcosa webhooks for real-time updates
app.post('/webhooks/carcosa/tenants', async (req, res) => {
  const { event, tenant } = req.body;
  
  if (event === 'tenant.created' || event === 'tenant.updated') {
    await adapter.syncTenants(); // Sync specific tenant
  }
  
  res.json({ ok: true });
});
```

### Error Handling

```typescript
try {
  const result = await adapter.syncTenants();
  if (result.errors.length > 0) {
    console.error('Sync errors:', result.errors);
    // Handle errors appropriately
  }
} catch (error) {
  console.error('Sync failed:', error);
  // Implement retry logic or alerting
}
```

## Migration Guide

### From Manual Tenant Management

1. **Install the adapter**: `npm install @carcosa/prisma-adapter`
2. **Add Carcosa fields**: Add `carcosaId` and `lastSynced` to your Tenant model
3. **Run migration**: `npx prisma migrate dev`
4. **Initialize adapter**: Set up the adapter with your Carcosa credentials
5. **First sync**: Run `adapter.syncTenants()` to populate existing tenants
6. **Update code**: Replace manual tenant lookups with `adapter.getTenantFromRequest()`

### From Other Tenant Systems

The adapter is designed to be flexible. You can:

- Map existing tenant fields to Carcosa's structure
- Use custom metadata for additional fields
- Implement gradual migration strategies
- Maintain backward compatibility during transition

## Best Practices

1. **Environment Variables**: Store Carcosa credentials in environment variables
2. **Error Monitoring**: Monitor sync errors and implement alerting
3. **Backup Strategy**: Always backup your database before major migrations
4. **Testing**: Test the adapter in a staging environment first
5. **Monitoring**: Track sync performance and adjust intervals as needed

## Troubleshooting

### Common Issues

**Sync fails with 401**: Check your API key and project ID
**Tenants not syncing**: Verify your Prisma schema has the required fields
**Performance issues**: Adjust sync intervals and implement selective syncing
**Memory leaks**: Always call `adapter.destroy()` when shutting down

### Debug Mode

```typescript
const adapter = new CarcosaTenantAdapter(prisma, {
  ...options,
  debug: true // Enable detailed logging
});
```

## Support

- 📚 [Documentation](https://docs.carcosa.dev)
- 🐛 [Issues](https://github.com/carcosa/carcosa/issues)
- 💬 [Discord](https://discord.gg/carcosa)
- 📧 [Email](mailto:support@carcosa.dev)
