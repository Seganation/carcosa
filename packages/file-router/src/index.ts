// Main exports for @carcosa/file-router
export * from './types';
export * from './router';
export * from './express-middleware';
export *from './file-serving';
export * from './url-routing';
export * from './transform-pipeline';
export * from './upload-progress';
export * from './progress-middleware';
export * from './react-hooks';
export * from './react-components';

// 🆕 NEW: UploadThing roadmap parity features
export * from './clipboard-upload';
export * from './streaming-upload';
export { 
  createStorageManager, createS3Adapter, createR2Adapter,
  BaseStorageAdapter, StorageManager,
  type StorageConfig, type UploadOptions as StorageUploadOptions, 
  type DownloadOptions, type FileMetadata as StorageFileMetadata,
  type UploadResult, type PresignedUrlResult, type StorageQuota, type StorageStats,
  type S3Config, type R2Config
} from './storage';
export { createDatabaseService, DatabaseService } from './database';
export * from './api';

// Re-export commonly used utilities
export { createUploadRouter, f } from './router';
export { createUploadMiddleware } from './express-middleware';
export { createFileServingMiddleware } from './file-serving';
export { createUrlRouter } from './url-routing';
export { createTransformPipeline, createTransformMiddleware } from './transform-pipeline';
export { createUploadProgressManager, UploadUtils } from './upload-progress';
export { createProgressMiddleware, setupProgressRoutes, uploadCorsMiddleware } from './progress-middleware';
// Storage exports handled above
export { createAuthMiddleware, createWebhookSystem, createRealtimeSystem } from './api';

// Default export for convenience
export { UploadRouter as default } from './router';