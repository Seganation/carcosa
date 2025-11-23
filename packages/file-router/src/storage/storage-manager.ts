// Storage Manager - Multi-Provider Storage Orchestration
// Production-ready storage management! 🚀

import { BaseStorageAdapter, StorageConfig, UploadOptions, DownloadOptions, FileMetadata, UploadResult, PresignedUrlResult } from './adapters/base.js';
import { S3StorageAdapter, createS3Adapter, S3Config } from './adapters/s3.js';
import { R2StorageAdapter, createR2Adapter, R2Config } from './adapters/r2.js';

// Storage provider configuration
export interface StorageProviderConfig {
  name: string;
  config: StorageConfig;
  priority: number; // Higher number = higher priority
  enabled: boolean;
  quota?: {
    maxBytes: number;
    maxFiles: number;
    maxFileSize: number;
  };
}

// Storage strategy configuration
export interface StorageStrategy {
  name: string;
  description: string;
  rules: StorageRule[];
  enabled: boolean;
}

export interface StorageRule {
  condition: 'file-size' | 'file-type' | 'organization' | 'project' | 'user-tier';
  operator: 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'in' | 'not-in';
  value: any;
  provider: string;
  priority: number;
}

// Storage allocation result
export interface StorageAllocation {
  provider: string;
  bucket: string;
  key: string;
  url: string;
  cost: {
    storage: number;
    transfer: number;
    requests: number;
    total: number;
  };
  performance: {
    latency: number;
    throughput: number;
    region: string;
  };
}

// Storage cost estimation
export interface StorageCostEstimate {
  provider: string;
  storageCost: number; // per GB per month
  transferCost: number; // per GB
  requestCost: number; // per 1000 requests
  estimatedMonthlyCost: number;
  savingsVsS3: number; // percentage
}

export class StorageManager {
  private providers: Map<string, BaseStorageAdapter> = new Map();
  private providerConfigs: Map<string, StorageProviderConfig> = new Map();
  private strategies: Map<string, StorageStrategy> = new Map();
  private defaultProvider: string = '';

  constructor() {
    this.initializeDefaultStrategies();
  }

  // Add storage provider
  async addProvider(name: string, config: StorageConfig): Promise<void> {
    try {
      let adapter: BaseStorageAdapter;

      switch (config.provider) {
        case 's3':
          adapter = createS3Adapter(config as S3Config);
          break;
        case 'r2':
          adapter = createR2Adapter(config as R2Config);
          break;
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }

      await adapter.initialize();
      
      this.providers.set(name, adapter);
      this.providerConfigs.set(name, {
        name,
        config,
        priority: 1,
        enabled: true,
      });

      // Set as default if it's the first provider
      if (this.defaultProvider === '') {
        this.defaultProvider = name;
      }

      console.log(`✅ Storage provider '${name}' (${config.provider}) added successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to add storage provider '${name}':`, error);
      throw error;
    }
  }

  // Remove storage provider
  removeProvider(name: string): void {
    this.providers.delete(name);
    this.providerConfigs.delete(name);
    
    if (this.defaultProvider === name) {
      this.defaultProvider = this.providers.keys().next().value || '';
    }
    
    console.log(`🗑️ Storage provider '${name}' removed`);
  }

  // Get storage provider
  getProvider(name: string): BaseStorageAdapter | undefined {
    return this.providers.get(name);
  }

  // Get all providers
  getAllProviders(): Map<string, BaseStorageAdapter> {
    return this.providers;
  }

  // Set default provider
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.defaultProvider = name;
    console.log(`🎯 Default storage provider set to '${name}'`);
  }

  // Get default provider
  getDefaultProvider(): string {
    return this.defaultProvider;
  }

  // Add storage strategy
  addStrategy(strategy: StorageStrategy): void {
    this.strategies.set(strategy.name, strategy);
    console.log(`📋 Storage strategy '${strategy.name}' added`);
  }

  // Get storage strategy
  getStrategy(name: string): StorageStrategy | undefined {
    return this.strategies.get(name);
  }

  // Allocate storage for file upload
  async allocateStorage(
    fileName: string,
    fileSize: number,
    metadata: {
      organizationId: string;
      projectId: string;
      userId?: string;
      fileType?: string;
      userTier?: 'free' | 'pro' | 'enterprise';
    }
  ): Promise<StorageAllocation> {
    // Find the best storage provider based on strategies
    const provider = await this.selectStorageProvider(fileName, fileSize, metadata);
    
    if (!provider) {
      throw new Error('No suitable storage provider found');
    }

    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new Error(`Storage provider '${provider}' not available`);
    }

    // Generate file key
    const key = (adapter as any).generateFileKey(
      metadata.organizationId,
      metadata.projectId,
      fileName,
      metadata.userId
    );

    // Get provider info
    const providerInfo = adapter.getAdapterInfo();
    
    // Estimate costs (simplified)
    const cost = this.estimateStorageCost(provider, fileSize);
    
    // Estimate performance
    const performance = this.estimatePerformance(provider, metadata);

    return {
      provider,
      bucket: providerInfo.bucket,
      key,
      url: `${providerInfo.bucket}.${providerInfo.provider === 'r2' ? 'r2.cloudflarestorage.com' : 's3.amazonaws.com'}/${key}`,
      cost,
      performance,
    };
  }

  // Upload file with automatic provider selection
  async uploadFile(
    fileName: string,
    fileSize: number,
    data: Buffer | ReadableStream | string,
    metadata: {
      organizationId: string;
      projectId: string;
      userId?: string;
      fileType?: string;
      userTier?: 'free' | 'pro' | 'enterprise';
    },
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const allocation = await this.allocateStorage(fileName, fileSize, metadata);
    const adapter = this.providers.get(allocation.provider);
    
    if (!adapter) {
      throw new Error(`Storage provider '${allocation.provider}' not available`);
    }

    return await adapter.uploadFile(allocation.key, data, options);
  }

  // Generate presigned upload URL
  async generatePresignedUploadUrl(
    fileName: string,
    fileSize: number,
    metadata: {
      organizationId: string;
      projectId: string;
      userId?: string;
      fileType?: string;
      userTier?: 'free' | 'pro' | 'enterprise';
    },
    options: UploadOptions = {}
  ): Promise<PresignedUrlResult> {
    const allocation = await this.allocateStorage(fileName, fileSize, metadata);
    const adapter = this.providers.get(allocation.provider);
    
    if (!adapter) {
      throw new Error(`Storage provider '${allocation.provider}' not available`);
    }

    return await adapter.generatePresignedUploadUrl(allocation.key, options);
  }

  // Download file from any provider
  async downloadFile(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    // Try to find the provider that has this file
    for (const [name, adapter] of this.providers) {
      try {
        if (await adapter.fileExists(key)) {
          return await adapter.downloadFile(key, options);
        }
      } catch (error) {
        console.warn(`Provider '${name}' failed to check file existence:`, error);
      }
    }
    
    throw new Error(`File '${key}' not found in any storage provider`);
  }

  // Get file metadata from any provider
  async getFileMetadata(key: string): Promise<FileMetadata> {
    // Try to find the provider that has this file
    for (const [name, adapter] of this.providers) {
      try {
        if (await adapter.fileExists(key)) {
          return await adapter.getFileMetadata(key);
        }
      } catch (error) {
        console.warn(`Provider '${name}' failed to check file existence:`, error);
      }
    }
    
    throw new Error(`File '${key}' not found in any storage provider`);
  }

  // Delete file from all providers
  async deleteFile(key: string): Promise<void> {
    const results = await Promise.allSettled(
      Array.from(this.providers.values()).map(adapter => adapter.deleteFile(key))
    );
    
    // Check if at least one deletion succeeded
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    if (successCount === 0) {
      throw new Error(`Failed to delete file '${key}' from any storage provider`);
    }
    
    console.log(`🗑️ File '${key}' deleted from ${successCount} storage provider(s)`);
  }

  // Get storage costs across all providers
  async getStorageCosts(): Promise<StorageCostEstimate[]> {
    const estimates: StorageCostEstimate[] = [];
    
    for (const [name, adapter] of this.providers) {
      try {
        const stats = await adapter.getStorageStats();
        const estimate = this.calculateProviderCosts(name, stats);
        estimates.push(estimate);
      } catch (error) {
        console.warn(`Failed to get costs for provider '${name}':`, error);
      }
    }
    
    return estimates.sort((a, b) => a.estimatedMonthlyCost - b.estimatedMonthlyCost);
  }

  // Get overall storage statistics
  async getOverallStats(): Promise<{
    totalFiles: number;
    totalBytes: number;
    averageFileSize: number;
    providers: Record<string, any>;
    costSavings: number;
  }> {
    const providerStats: Record<string, any> = {};
    let totalFiles = 0;
    let totalBytes = 0;
    
    for (const [name, adapter] of this.providers) {
      try {
        const stats = await adapter.getStorageStats();
        providerStats[name] = stats;
        totalFiles += stats.totalFiles;
        totalBytes += stats.totalBytes;
      } catch (error) {
        console.warn(`Failed to get stats for provider '${name}':`, error);
      }
    }
    
    const costs = await this.getStorageCosts();
    const s3Cost = costs.find(c => c.provider.includes('s3'))?.estimatedMonthlyCost || 0;
    const currentCost = costs.reduce((sum, c) => sum + c.estimatedMonthlyCost, 0);
    const costSavings = s3Cost > 0 ? ((s3Cost - currentCost) / s3Cost) * 100 : 0;
    
    return {
      totalFiles,
      totalBytes,
      averageFileSize: totalFiles > 0 ? totalBytes / totalFiles : 0,
      providers: providerStats,
      costSavings,
    };
  }

  // Health check all providers
  async healthCheck(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const [name, adapter] of this.providers) {
      try {
        const health = await adapter.healthCheck();
        results[name] = health;
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: `Health check failed: ${(error as Error).message}`,
        };
      }
    }
    
    return results;
  }

  // Private methods

  private initializeDefaultStrategies(): void {
    // Cost-optimization strategy
    this.addStrategy({
      name: 'cost-optimization',
      description: 'Automatically route files to the most cost-effective storage',
      enabled: true,
      rules: [
        {
          condition: 'file-size',
          operator: 'lt',
          value: 100 * 1024 * 1024, // 100MB
          provider: 'r2', // Use R2 for smaller files (cheaper)
          priority: 1,
        },
        {
          condition: 'file-size',
          operator: 'gte',
          value: 100 * 1024 * 1024, // 100MB
          provider: 's3', // Use S3 for larger files (better for large files)
          priority: 2,
        },
      ],
    });

    // Performance strategy
    this.addStrategy({
      name: 'performance',
      description: 'Route files based on performance requirements',
      enabled: true,
      rules: [
        {
          condition: 'user-tier',
          operator: 'eq',
          value: 'enterprise',
          provider: 's3', // Enterprise users get S3 performance
          priority: 1,
        },
        {
          condition: 'user-tier',
          operator: 'in',
          value: ['free', 'pro'],
          provider: 'r2', // Free/Pro users get R2 (still fast)
          priority: 2,
        },
      ],
    });
  }

  private async selectStorageProvider(
    fileName: string,
    fileSize: number,
    metadata: any
  ): Promise<string> {
    const candidates: Array<{ provider: string; priority: number; score: number }> = [];
    
    // Evaluate each strategy
    for (const strategy of this.strategies.values()) {
      if (!strategy.enabled) continue;
      
      for (const rule of strategy.rules) {
        if (this.evaluateRule(rule, fileName, fileSize, metadata)) {
          const provider = rule.provider;
          const priority = rule.priority;
          
          // Calculate score based on provider performance and cost
          const score = this.calculateProviderScore(provider, fileSize, metadata);
          
          candidates.push({ provider, priority, score });
        }
      }
    }
    
    if (candidates.length === 0) {
      // Fallback to default provider
      return this.defaultProvider;
    }
    
    // Sort by priority (higher first) then by score (higher first)
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.score - a.score;
    });
    
    return candidates[0].provider;
  }

  private evaluateRule(
    rule: StorageRule,
    fileName: string,
    fileSize: number,
    metadata: any
  ): boolean {
    switch (rule.condition) {
      case 'file-size':
        return this.compareValues(fileSize, rule.operator, rule.value);
      case 'file-type':
        const fileType = this.getFileType(fileName);
        return this.compareValues(fileType, rule.operator, rule.value);
      case 'organization':
        return this.compareValues(metadata.organizationId, rule.operator, rule.value);
      case 'user-tier':
        return this.compareValues(metadata.userTier, rule.operator, rule.value);
      default:
        return false;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      case 'eq': return actual === expected;
      case 'gte': return actual >= expected;
      case 'gt': return actual > expected;
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      case 'not-in': return Array.isArray(expected) && !expected.includes(actual);
      default: return false;
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) return 'audio';
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return 'document';
    
    return 'other';
  }

  private calculateProviderScore(provider: string, fileSize: number, metadata: any): number {
    let score = 0;
    
    // Base score
    score += 50;
    
    // File size optimization
    if (provider === 'r2' && fileSize < 100 * 1024 * 1024) {
      score += 30; // R2 is great for smaller files
    } else if (provider === 's3' && fileSize >= 100 * 1024 * 1024) {
      score += 30; // S3 is better for larger files
    }
    
    // User tier optimization
    if (metadata.userTier === 'enterprise' && provider === 's3') {
      score += 20; // Enterprise users get S3
    } else if (metadata.userTier === 'free' && provider === 'r2') {
      score += 20; // Free users get R2
    }
    
    return score;
  }

  private estimateStorageCost(provider: string, fileSize: number): {
    storage: number;
    transfer: number;
    requests: number;
    total: number;
  } {
    const sizeGB = fileSize / (1024 * 1024 * 1024);
    
    // Simplified cost estimation (real costs would be more complex)
    let storageCost = 0;
    let transferCost = 0;
    let requestCost = 0;
    
    if (provider === 's3') {
      storageCost = sizeGB * 0.023; // S3 Standard pricing
      transferCost = sizeGB * 0.09; // S3 transfer pricing
      requestCost = 0.0004; // S3 request pricing
    } else if (provider === 'r2') {
      storageCost = sizeGB * 0.015; // R2 pricing (~35% cheaper)
      transferCost = 0; // R2 has no egress fees!
      requestCost = 0.00036; // R2 request pricing
    }
    
    return {
      storage: storageCost,
      transfer: transferCost,
      requests: requestCost,
      total: storageCost + transferCost + requestCost,
    };
  }

  private estimatePerformance(provider: string, metadata: any): {
    latency: number;
    throughput: number;
    region: string;
  } {
    // Simplified performance estimation
    if (provider === 's3') {
      return {
        latency: 50, // ms
        throughput: 1000, // MB/s
        region: 'us-east-1',
      };
    } else if (provider === 'r2') {
      return {
        latency: 60, // ms (slightly higher but still excellent)
        throughput: 800, // MB/s
        region: 'global', // R2 is globally distributed
      };
    }
    
    return {
      latency: 100,
      throughput: 500,
      region: 'unknown',
    };
  }

  private calculateProviderCosts(provider: string, stats: any): StorageCostEstimate {
    const sizeGB = stats.totalBytes / (1024 * 1024 * 1024);
    
    let storageCost = 0;
    let transferCost = 0;
    let requestCost = 0;
    
    if (provider === 's3') {
      storageCost = sizeGB * 0.023;
      transferCost = sizeGB * 0.09;
      requestCost = (stats.totalFiles / 1000) * 0.0004;
    } else if (provider === 'r2') {
      storageCost = sizeGB * 0.015;
      transferCost = 0; // No egress fees!
      requestCost = (stats.totalFiles / 1000) * 0.00036;
    }
    
    const estimatedMonthlyCost = storageCost + transferCost + requestCost;
    const s3EquivalentCost = sizeGB * 0.023 + sizeGB * 0.09 + (stats.totalFiles / 1000) * 0.0004;
    const savingsVsS3 = s3EquivalentCost > 0 ? ((s3EquivalentCost - estimatedMonthlyCost) / s3EquivalentCost) * 100 : 0;
    
    return {
      provider,
      storageCost,
      transferCost,
      requestCost,
      estimatedMonthlyCost,
      savingsVsS3,
    };
  }
}

// Factory function
export function createStorageManager(): StorageManager {
  return new StorageManager();
}