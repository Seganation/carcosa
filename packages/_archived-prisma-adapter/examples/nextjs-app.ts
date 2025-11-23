import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { CarcosaTenantAdapter } from '../src';

const prisma = new PrismaClient();

// Initialize Carcosa tenant adapter
const carcosaAdapter = new CarcosaTenantAdapter(prisma, {
  projectId: process.env.CARCOSA_PROJECT_ID!,
  apiKey: process.env.CARCOSA_API_KEY!,
  autoSync: true
});

// Helper function to get tenant from request
async function getTenantFromRequest(req: NextApiRequest) {
  try {
    return await carcosaAdapter.getTenantFromRequest(req);
  } catch (error) {
    console.error('Failed to get tenant:', error);
    return null;
  }
}

// API route example
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tenant = await getTenantFromRequest(req);
    
    if (!tenant) {
      return res.status(400).json({
        error: 'tenant_required',
        message: 'Tenant context is required'
      });
    }
    
    // Your tenant-specific logic here
    const data = await prisma.user.findMany({
      where: { tenantId: tenant.tenantId }
    });
    
    res.json({
      tenant: tenant.tenantSlug,
      data,
      message: `Data for tenant: ${tenant.tenantSlug}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Cleanup on process exit
process.on('exit', () => {
  carcosaAdapter.destroy();
  prisma.$disconnect();
});
