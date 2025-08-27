import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CarcosaTenantAdapter, 
  carcosaTenantMiddleware, 
  requireTenant, 
  withTenant 
} from '../src';

const app = express();
const prisma = new PrismaClient();

// Initialize Carcosa tenant adapter
const carcosaAdapter = new CarcosaTenantAdapter(prisma, {
  projectId: process.env.CARCOSA_PROJECT_ID!,
  apiKey: process.env.CARCOSA_API_KEY!,
  autoSync: true,
  syncInterval: 5 * 60 * 1000 // 5 minutes
});

// Middleware
app.use(express.json());
app.use(carcosaTenantMiddleware(carcosaAdapter));

// Routes that require tenant context
app.get('/api/tenant/profile', requireTenant(), (req, res) => {
  res.json({
    tenant: req.tenant,
    message: `Hello from tenant: ${req.tenant!.tenantSlug}`
  });
});

// Routes that work with or without tenant
app.get('/api/data', withTenant(), (req, res) => {
  if (req.tenant) {
    // Multi-tenant data
    res.json({
      data: `Tenant-specific data for ${req.tenant.tenantSlug}`,
      hasTenant: true
    });
  } else {
    // Global data
    res.json({
      data: 'Global data',
      hasTenant: false
    });
  }
});

// Admin route to sync tenants
app.post('/api/admin/sync-tenants', async (req, res) => {
  try {
    const result = await carcosaAdapter.syncTenants();
    res.json({
      message: 'Tenants synced successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'sync_failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  carcosaAdapter.destroy();
  prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Carcosa tenant adapter initialized');
});
