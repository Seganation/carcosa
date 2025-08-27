export interface CarcosaTenant {
  id: string;
  slug: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TenantSyncOptions {
  projectId: string;
  apiKey: string;
  apiUrl?: string;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
