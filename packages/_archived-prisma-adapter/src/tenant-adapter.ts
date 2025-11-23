import { PrismaClient } from '@prisma/client';
import { CarcosaTenant, TenantSyncOptions, TenantContext, SyncResult } from './types';

export class CarcosaTenantAdapter {
  private prisma: PrismaClient;
  private options: TenantSyncOptions;
  private apiUrl: string;
  private syncInterval?: NodeJS.Timeout;

  constructor(prisma: PrismaClient, options: TenantSyncOptions) {
    this.prisma = prisma;
    this.options = options;
    this.apiUrl = options.apiUrl || 'http://localhost:4000';
    
    if (options.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Sync tenants from Carcosa to local database
   */
  async syncTenants(): Promise<SyncResult> {
    try {
      // Fetch tenants from Carcosa
      const response = await fetch(`${this.apiUrl}/api/v1/projects/${this.options.projectId}/tenants`, {
        headers: {
          'Authorization': `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tenants: ${response.statusText}`);
      }

      const { tenants } = await response.json() as { tenants: CarcosaTenant[] };
      
      // Get existing tenants from local DB
      const existingTenants = await this.prisma.tenant.findMany();
      
      const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };
      
      // Create/update tenants
      for (const tenant of tenants) {
        try {
          const existing = existingTenants.find(t => t.carcosaId === tenant.id);
          
          if (existing) {
            await this.prisma.tenant.update({
              where: { id: existing.id },
              data: {
                slug: tenant.slug,
                metadata: tenant.metadata,
                lastSynced: new Date()
              }
            });
            result.updated++;
          } else {
            await this.prisma.tenant.create({
              data: {
                carcosaId: tenant.id,
                slug: tenant.slug,
                metadata: tenant.metadata,
                lastSynced: new Date()
              }
            });
            result.created++;
          }
        } catch (error) {
          result.errors.push(`Failed to sync tenant ${tenant.slug}: ${error}`);
        }
      }
      
      // Delete tenants that no longer exist in Carcosa
      const carcosaIds = tenants.map(t => t.id);
      const toDelete = existingTenants.filter(t => !carcosaIds.includes(t.carcosaId!));
      
      for (const tenant of toDelete) {
        try {
          await this.prisma.tenant.delete({ where: { id: tenant.id } });
          result.deleted++;
        } catch (error) {
          result.errors.push(`Failed to delete tenant ${tenant.slug}: ${error}`);
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Tenant sync failed: ${error}`);
    }
  }

  /**
   * Get tenant context from request (e.g., from subdomain, header, or path)
   */
  async getTenantFromRequest(req: any): Promise<TenantContext | null> {
    // Try to get tenant from subdomain
    const host = req.headers.host || req.headers['x-forwarded-host'];
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await this.prisma.tenant.findFirst({
          where: { slug: subdomain }
        });
        if (tenant) {
          return {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            metadata: tenant.metadata as Record<string, any>
          };
        }
      }
    }
    
    // Try to get tenant from header
    const tenantSlug = req.headers['x-tenant-slug'] || req.headers['x-tenant-id'];
    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { 
          OR: [
            { slug: tenantSlug },
            { id: tenantSlug }
          ]
        }
      });
      if (tenant) {
        return {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          metadata: tenant.metadata as Record<string, any>
        };
      }
    }
    
    return null;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<TenantContext | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug }
    });
    
    if (!tenant) return null;
    
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      metadata: tenant.metadata as Record<string, any>
    };
  }

  /**
   * Start automatic syncing
   */
  private startAutoSync() {
    const interval = this.options.syncInterval || 5 * 60 * 1000; // 5 minutes default
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncTenants();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, interval);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopAutoSync();
  }
}
