// Storage System Exports
// Production-ready cloud storage integration! 🚀

// Base interfaces and classes
export {
  BaseStorageAdapter,
  type StorageConfig,
  type UploadOptions,
  type DownloadOptions,
  type FileMetadata,
  type UploadResult,
  type PresignedUrlResult,
  type StorageQuota,
  type StorageStats
} from './adapters/base';

// Storage adapters
export { S3StorageAdapter, createS3Adapter, type S3Config } from './adapters/s3';
export { R2StorageAdapter, createR2Adapter, type R2Config } from './adapters/r2';

// Storage management
export { StorageManager, createStorageManager } from './storage-manager';