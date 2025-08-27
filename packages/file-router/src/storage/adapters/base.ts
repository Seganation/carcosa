// Base Storage Adapter Interface
// Production-ready cloud storage integration! 🚀

export interface StorageConfig {
  provider: 's3' | 'r2' | 'gcs' | 'local';
  bucket: string;
  region?: string;
  endpoint?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  options?: {
    forcePathStyle?: boolean;
    signatureVersion?: string;
    maxRetries?: number;
    timeout?: number;
  };
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  encryption?: {
    algorithm: 'AES256' | 'aws:kms';
    keyId?: string;
  };
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  expiresIn?: number; // seconds
}

export interface DownloadOptions {
  expiresIn?: number; // seconds for presigned URLs
  responseContentType?: string;
  responseContentDisposition?: string;
  responseCacheControl?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  storageClass?: string;
  versionId?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  etag: string;
  versionId?: string;
  metadata: FileMetadata;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: Date;
  fields?: Record<string, string>; // For POST policy uploads
}

export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  fileCount: number;
  maxFileSize: number;
  maxFiles: number;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  averageFileSize: number;
  oldestFile: Date;
  newestFile: Date;
  storageClasses: Record<string, { count: number; bytes: number }>;
}

// Base storage adapter interface
export abstract class BaseStorageAdapter {
  protected config: StorageConfig;
  protected initialized: boolean = false;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  // Initialize the storage adapter
  abstract initialize(): Promise<void>;

  // Check if adapter is ready
  isReady(): boolean {
    return this.initialized;
  }

  // Upload file with progress tracking
  abstract uploadFile(
    key: string,
    data: Buffer | ReadableStream | string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  // Upload file chunk (for resumable uploads)
  abstract uploadChunk(
    key: string,
    chunkData: Buffer,
    chunkNumber: number,
    totalChunks: number,
    options?: UploadOptions
  ): Promise<{ etag: string; partNumber: number }>;

  // Complete multipart upload
  abstract completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ etag: string; partNumber: number }>,
    options?: UploadOptions
  ): Promise<UploadResult>;

  // Generate presigned upload URL
  abstract generatePresignedUploadUrl(
    key: string,
    options?: UploadOptions
  ): Promise<PresignedUrlResult>;

  // Generate presigned download URL
  abstract generatePresignedDownloadUrl(
    key: string,
    options?: DownloadOptions
  ): Promise<PresignedUrlResult>;

  // Download file
  abstract downloadFile(key: string, options?: DownloadOptions): Promise<Buffer>;

  // Get file metadata
  abstract getFileMetadata(key: string): Promise<FileMetadata>;

  // Delete file
  abstract deleteFile(key: string): Promise<void>;

  // List files
  abstract listFiles(
    prefix?: string,
    maxKeys?: number,
    continuationToken?: string
  ): Promise<{
    files: FileMetadata[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }>;

  // Check if file exists
  abstract fileExists(key: string): Promise<boolean>;

  // Copy file
  abstract copyFile(
    sourceKey: string,
    destinationKey: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  // Move file (copy + delete)
  async moveFile(
    sourceKey: string,
    destinationKey: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const result = await this.copyFile(sourceKey, destinationKey, options);
    await this.deleteFile(sourceKey);
    return result;
  }

  // Get storage quota
  abstract getStorageQuota(): Promise<StorageQuota>;

  // Get storage statistics
  abstract getStorageStats(): Promise<StorageStats>;

  // Validate configuration
  protected validateConfig(): void {
    if (!this.config.bucket) {
      throw new Error('Storage bucket is required');
    }
    if (!this.config.credentials.accessKeyId || !this.config.credentials.secretAccessKey) {
      throw new Error('Storage credentials are required');
    }
  }

  // Generate file key with organization/project structure
  protected generateFileKey(
    organizationId: string,
    projectId: string,
    fileName: string,
    userId?: string
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    
    if (userId) {
      return `${organizationId}/${projectId}/${userId}/${timestamp}_${randomId}_${fileName}`;
    }
    
    return `${organizationId}/${projectId}/${timestamp}_${randomId}_${fileName}`;
  }

  // Parse file key to extract metadata
  protected parseFileKey(key: string): {
    organizationId: string;
    projectId: string;
    userId?: string;
    timestamp: number;
    randomId: string;
    fileName: string;
  } {
    const parts = key.split('/');
    
    if (parts.length < 4) {
      throw new Error('Invalid file key format');
    }

    const [organizationId, projectId, userIdOrTimestamp, ...rest] = parts;
    
    // Check if third part is userId or timestamp
    const isUserId = isNaN(parseInt(userIdOrTimestamp));
    
    if (isUserId) {
      // Format: org/project/userId/timestamp_randomId_filename
      const [timestamp, randomId, ...fileNameParts] = rest;
      return {
        organizationId,
        projectId,
        userId: userIdOrTimestamp,
        timestamp: parseInt(timestamp),
        randomId,
        fileName: fileNameParts.join('_'),
      };
    } else {
      // Format: org/project/timestamp_randomId_filename
      const [randomId, ...fileNameParts] = rest;
      return {
        organizationId,
        projectId,
        timestamp: parseInt(userIdOrTimestamp),
        randomId,
        fileName: fileNameParts.join('_'),
      };
    }
  }

  // Generate temporary credentials for client uploads
  abstract generateTemporaryCredentials(
    key: string,
    expiresIn: number,
    permissions: 'read' | 'write' | 'readwrite'
  ): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiresAt: Date;
  }>;

  // Health check
  abstract healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    message: string;
    details?: any;
  }>;

  // Get adapter info
  getAdapterInfo(): {
    provider: string;
    bucket: string;
    region?: string;
    features: string[];
  } {
    return {
      provider: this.config.provider,
      bucket: this.config.bucket,
      region: this.config.region,
      features: [
        'presigned-urls',
        'multipart-uploads',
        'chunked-uploads',
        'file-metadata',
        'storage-quotas',
        'temporary-credentials',
      ],
    };
  }
}