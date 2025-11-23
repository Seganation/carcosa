// Main exports for @carcosa/file-router
export * from './types.js';
export * from './router.js';
export * from './express-middleware.js';
export *from './file-serving.js';
export * from './url-routing.js';
export * from './transform-pipeline.js';
export * from './upload-progress.js';
export * from './progress-middleware.js';
export * from './react-hooks.js';
export * from './react-components.js';

// 🆕 NEW: UploadThing roadmap parity features
export * from './clipboard-upload.js';
export * from './streaming-upload.js';
export { 
  createStorageManager, createS3Adapter, createR2Adapter,
  BaseStorageAdapter, StorageManager,
  type StorageConfig, type UploadOptions as StorageUploadOptions,
  type DownloadOptions, type FileMetadata as StorageFileMetadata,
  type UploadResult, type PresignedUrlResult, type StorageQuota, type StorageStats,
  type S3Config, type R2Config
} from './storage/index.js';
export { createDatabaseService, DatabaseService } from './database/index.js';
export * from './api/index.js';// Re-export commonly used utilities
export { createUploadRouter, f } from './router.js';
export { createUploadMiddleware } from './express-middleware.js';
export { createFileServingMiddleware } from './file-serving.js';
export { createUrlRouter } from './url-routing.js';
export { createTransformPipeline, createTransformMiddleware } from './transform-pipeline.js';
export { createUploadProgressManager, UploadUtils } from './upload-progress.js';
export { createProgressMiddleware, setupProgressRoutes, uploadCorsMiddleware } from './progress-middleware.js';
// Storage exports handled above
export { createAuthMiddleware, createWebhookSystem, createRealtimeSystem } from './api/index.js';

// Default export for convenience
export { UploadRouter as default } from './router.js';