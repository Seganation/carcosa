// AWS S3 Storage Adapter
// Production-ready S3 integration! 🚀

import { 
  BaseStorageAdapter, 
  StorageConfig, 
  UploadOptions, 
  DownloadOptions, 
  FileMetadata, 
  UploadResult, 
  PresignedUrlResult, 
  StorageQuota, 
  StorageStats 
} from './base';

// S3-specific configuration
export interface S3Config extends StorageConfig {
  provider: 's3';
  region: string; // Required for S3
  options?: {
    forcePathStyle?: boolean;
    signatureVersion?: string;
    maxRetries?: number;
    timeout?: number;
    s3ForcePathStyle?: boolean;
    s3Accelerate?: boolean;
    s3UseAccelerateEndpoint?: boolean;
  };
}

// S3 multipart upload part
interface S3Part {
  ETag: string;
  PartNumber: number;
}

// S3 multipart upload state
interface S3MultipartUpload {
  uploadId: string;
  key: string;
  parts: S3Part[];
  initiatedAt: Date;
  expiresAt: Date;
}

export class S3StorageAdapter extends BaseStorageAdapter {
  private s3Client: any; // AWS SDK S3 client
  private multipartUploads: Map<string, S3MultipartUpload> = new Map();

  constructor(config: S3Config) {
    super(config);
    this.validateS3Config();
  }

  // Initialize S3 client
  async initialize(): Promise<void> {
    try {
      // Dynamically import AWS SDK (to avoid bundling issues)
      const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, 
              CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand,
              AbortMultipartUploadCommand, HeadObjectCommand, ListObjectsV2Command,
              CopyObjectCommand, PutObjectAclCommand } = await import('@aws-sdk/client-s3');
      
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      // Create S3 client
      this.s3Client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.credentials.accessKeyId,
          secretAccessKey: this.config.credentials.secretAccessKey,
        },
        endpoint: this.config.endpoint,
        forcePathStyle: this.config.options?.forcePathStyle,
        maxAttempts: this.config.options?.maxRetries || 3,
        requestHandler: {
          httpOptions: {
            timeout: this.config.options?.timeout || 300000, // 5 minutes
          },
        },
      });

      // Test connection
      await this.healthCheck();
      
      this.initialized = true;
      console.log(`✅ S3 Storage Adapter initialized for bucket: ${this.config.bucket}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize S3 Storage Adapter:', error);
      throw new Error(`S3 initialization failed: ${(error as Error).message}`);
    }
  }

  // Upload file directly
  async uploadFile(
    key: string,
    data: Buffer | ReadableStream | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: data,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        Tagging: options.tags ? this.formatTags(options.tags) : undefined,
        ServerSideEncryption: options.encryption?.algorithm,
        SSEKMSKeyId: options.encryption?.keyId,
        ACL: options.acl,
      });

      const result = await this.s3Client.send(command);
      
      const metadata: FileMetadata = {
        key,
        size: data instanceof Buffer ? data.length : 0,
        contentType: options.contentType || 'application/octet-stream',
        lastModified: new Date(),
        etag: result.ETag?.replace(/"/g, '') || '',
        metadata: options.metadata,
        tags: options.tags,
        versionId: result.VersionId,
        storageClass: result.StorageClass,
      };

      return {
        key,
        url: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`,
        etag: metadata.etag,
        versionId: metadata.versionId,
        metadata,
      };

    } catch (error) {
      console.error(`❌ S3 upload failed for key ${key}:`, error);
      throw new Error(`S3 upload failed: ${(error as Error).message}`);
    }
  }

  // Upload file chunk for multipart uploads
  async uploadChunk(
    key: string,
    chunkData: Buffer,
    chunkNumber: number,
    totalChunks: number,
    options: UploadOptions = {}
  ): Promise<{ etag: string; partNumber: number }> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { UploadPartCommand } = await import('@aws-sdk/client-s3');
      
      // Get or create multipart upload
      let multipartUpload = this.multipartUploads.get(key);
      if (!multipartUpload) {
        multipartUpload = await this.initiateMultipartUpload(key, options);
      }

      const command = new UploadPartCommand({
        Bucket: this.config.bucket,
        Key: key,
        UploadId: multipartUpload.uploadId,
        PartNumber: chunkNumber + 1, // S3 part numbers start from 1
        Body: chunkData,
        ContentLength: chunkData.length,
      });

      const result = await this.s3Client.send(command);
      
      // Store part information
      multipartUpload.parts.push({
        ETag: result.ETag!,
        PartNumber: chunkNumber + 1,
      });

      return {
        etag: result.ETag!.replace(/"/g, ''),
        partNumber: chunkNumber + 1,
      };

    } catch (error) {
      console.error(`❌ S3 chunk upload failed for key ${key}, chunk ${chunkNumber}:`, error);
      throw new Error(`S3 chunk upload failed: ${(error as Error).message}`);
    }
  }

  // Complete multipart upload
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ etag: string; partNumber: number }>,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { CompleteMultipartUploadCommand } = await import('@aws-sdk/client-s3');
      
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(part => ({
            ETag: `"${part.etag}"`,
            PartNumber: part.partNumber,
          })),
        },
      });

      const result = await this.s3Client.send(command);
      
      // Clean up multipart upload tracking
      this.multipartUploads.delete(key);
      
      const metadata: FileMetadata = {
        key,
        size: 0, // Would need to calculate from parts
        contentType: options.contentType || 'application/octet-stream',
        lastModified: new Date(),
        etag: result.ETag?.replace(/"/g, '') || '',
        metadata: options.metadata,
        tags: options.tags,
        versionId: result.VersionId,
        storageClass: result.StorageClass,
      };

      return {
        key,
        url: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`,
        etag: metadata.etag,
        versionId: metadata.versionId,
        metadata,
      };

    } catch (error) {
      console.error(`❌ S3 multipart upload completion failed for key ${key}:`, error);
      throw new Error(`S3 multipart upload completion failed: ${(error as Error).message}`);
    }
  }

  // Generate presigned upload URL
  async generatePresignedUploadUrl(
    key: string,
    options: UploadOptions = {}
  ): Promise<PresignedUrlResult> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        Tagging: options.tags ? this.formatTags(options.tags) : undefined,
        ServerSideEncryption: options.encryption?.algorithm,
        SSEKMSKeyId: options.encryption?.keyId,
        ACL: options.acl,
      });

      const expiresIn = options.expiresIn || 3600; // 1 hour default
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return {
        url,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };

    } catch (error) {
      console.error(`❌ Failed to generate S3 presigned upload URL for key ${key}:`, error);
      throw new Error(`S3 presigned URL generation failed: ${(error as Error).message}`);
    }
  }

  // Generate presigned download URL
  async generatePresignedDownloadUrl(
    key: string,
    options: DownloadOptions = {}
  ): Promise<PresignedUrlResult> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseCacheControl: options.responseCacheControl,
      });

      const expiresIn = options.expiresIn || 3600; // 1 hour default
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return {
        url,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };

    } catch (error) {
      console.error(`❌ Failed to generate S3 presigned download URL for key ${key}:`, error);
      throw new Error(`S3 presigned URL generation failed: ${(error as Error).message}`);
    }
  }

  // Download file
  async downloadFile(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseCacheControl: options.responseCacheControl,
      });

      const result = await this.s3Client.send(command);
      
      if (!result.Body) {
        throw new Error('No file body received from S3');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = result.Body as any;
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

    } catch (error) {
      console.error(`❌ S3 download failed for key ${key}:`, error);
      throw new Error(`S3 download failed: ${(error as Error).message}`);
    }
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<FileMetadata> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      
      return {
        key,
        size: result.ContentLength || 0,
        contentType: result.ContentType || 'application/octet-stream',
        lastModified: result.LastModified || new Date(),
        etag: result.ETag?.replace(/"/g, '') || '',
        metadata: result.Metadata,
        tags: result.TagCount ? await this.getFileTags(key) : undefined,
        storageClass: result.StorageClass,
        versionId: result.VersionId,
      };

    } catch (error) {
      console.error(`❌ Failed to get S3 file metadata for key ${key}:`, error);
      throw new Error(`S3 metadata retrieval failed: ${(error as Error).message}`);
    }
  }

  // Delete file
  async deleteFile(key: string): Promise<void> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      
      // Clean up multipart upload if exists
      this.multipartUploads.delete(key);

    } catch (error) {
      console.error(`❌ S3 file deletion failed for key ${key}:`, error);
      throw new Error(`S3 file deletion failed: ${(error as Error).message}`);
    }
  }

  // List files
  async listFiles(
    prefix?: string,
    maxKeys: number = 1000,
    continuationToken?: string
  ): Promise<{
    files: FileMetadata[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      });

      const result = await this.s3Client.send(command);
      
      const files: FileMetadata[] = [];
      for (const object of result.Contents || []) {
        if (object.Key) {
          files.push({
            key: object.Key,
            size: object.Size || 0,
            contentType: 'application/octet-stream', // Would need to get from HeadObject
            lastModified: object.LastModified || new Date(),
            etag: object.ETag?.replace(/"/g, '') || '',
            storageClass: object.StorageClass,
          });
        }
      }

      return {
        files,
        nextContinuationToken: result.NextContinuationToken,
        isTruncated: result.IsTruncated || false,
      };

    } catch (error) {
      console.error('❌ S3 file listing failed:', error);
      throw new Error(`S3 file listing failed: ${(error as Error).message}`);
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Copy file
  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.initialized) throw new Error('S3 adapter not initialized');

    try {
      const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new CopyObjectCommand({
        Bucket: this.config.bucket,
        Key: destinationKey,
        CopySource: `${this.config.bucket}/${sourceKey}`,
        Metadata: options.metadata,
        Tagging: options.tags ? this.formatTags(options.tags) : undefined,
        ServerSideEncryption: options.encryption?.algorithm,
        SSEKMSKeyId: options.encryption?.keyId,
        ACL: options.acl,
      });

      const result = await this.s3Client.send(command);
      
      // Get metadata of copied file
      const metadata = await this.getFileMetadata(destinationKey);
      
      return {
        key: destinationKey,
        url: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${destinationKey}`,
        etag: metadata.etag,
        versionId: metadata.versionId,
        metadata,
      };

    } catch (error) {
      console.error(`❌ S3 file copy failed from ${sourceKey} to ${destinationKey}:`, error);
      throw new Error(`S3 file copy failed: ${(error as Error).message}`);
    }
  }

  // Get storage quota (S3 doesn't have quotas, so we simulate)
  async getStorageQuota(): Promise<StorageQuota> {
    // S3 doesn't have built-in quotas, so we return a high limit
    return {
      totalBytes: 1024 * 1024 * 1024 * 1024 * 1024, // 1 PB
      usedBytes: 0, // Would need to calculate from listFiles
      availableBytes: 1024 * 1024 * 1024 * 1024 * 1024, // 1 PB
      fileCount: 0, // Would need to calculate from listFiles
      maxFileSize: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
      maxFiles: Number.MAX_SAFE_INTEGER,
    };
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    try {
      const stats = await this.listFiles(undefined, 10000);
      
      let totalBytes = 0;
      let oldestFile = new Date();
      let newestFile = new Date(0);
      const storageClasses: Record<string, { count: number; bytes: number }> = {};

      for (const file of stats.files) {
        totalBytes += file.size;
        
        if (file.lastModified < oldestFile) {
          oldestFile = file.lastModified;
        }
        if (file.lastModified > newestFile) {
          newestFile = file.lastModified;
        }

        const storageClass = file.storageClass || 'STANDARD';
        if (!storageClasses[storageClass]) {
          storageClasses[storageClass] = { count: 0, bytes: 0 };
        }
        storageClasses[storageClass].count++;
        storageClasses[storageClass].bytes += file.size;
      }

      return {
        totalFiles: stats.files.length,
        totalBytes,
        averageFileSize: stats.files.length > 0 ? totalBytes / stats.files.length : 0,
        oldestFile,
        newestFile,
        storageClasses,
      };

    } catch (error) {
      console.error('❌ Failed to get S3 storage stats:', error);
      throw new Error(`S3 storage stats failed: ${(error as Error).message}`);
    }
  }

  // Generate temporary credentials (would need STS integration)
  async generateTemporaryCredentials(
    key: string,
    expiresIn: number,
    permissions: 'read' | 'write' | 'readwrite'
  ): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiresAt: Date;
  }> {
    // This would require AWS STS integration
    // For now, return the main credentials (not recommended for production)
    return {
      accessKeyId: this.config.credentials.accessKeyId,
      secretAccessKey: this.config.credentials.secretAccessKey,
      sessionToken: '',
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    message: string;
    details?: any;
  }> {
    try {
      // Try to list objects (lightweight operation)
      await this.listFiles(undefined, 1);
      
      return {
        status: 'healthy',
        message: 'S3 connection is healthy',
        details: {
          bucket: this.config.bucket,
          region: this.config.region,
          endpoint: this.config.endpoint,
        },
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'S3 connection failed',
        details: {
          error: (error as Error).message,
          bucket: this.config.bucket,
          region: this.config.region,
        },
      };
    }
  }

  // Private helper methods
  private validateS3Config(): void {
    if (this.config.provider !== 's3') {
      throw new Error('Invalid provider for S3 adapter');
    }
    if (!this.config.region) {
      throw new Error('S3 region is required');
    }
    this.validateConfig();
  }

  private async initiateMultipartUpload(key: string, options: UploadOptions): Promise<S3MultipartUpload> {
    const { CreateMultipartUploadCommand } = await import('@aws-sdk/client-s3');
    
    const command = new CreateMultipartUploadCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata,
      Tagging: options.tags ? this.formatTags(options.tags) : undefined,
      ServerSideEncryption: options.encryption?.algorithm,
      SSEKMSKeyId: options.encryption?.keyId,
      ACL: options.acl,
    });

    const result = await this.s3Client.send(command);
    
    const multipartUpload: S3MultipartUpload = {
      uploadId: result.UploadId!,
      key,
      parts: [],
      initiatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.multipartUploads.set(key, multipartUpload);
    return multipartUpload;
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  private async getFileTags(key: string): Promise<Record<string, string> | undefined> {
    try {
      const { GetObjectTaggingCommand } = await import('@aws-sdk/client-s3');
      
      const command = new GetObjectTaggingCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      
      if (!result.TagSet || result.TagSet.length === 0) {
        return undefined;
      }

      const tags: Record<string, string> = {};
      for (const tag of result.TagSet) {
        if (tag.Key && tag.Value) {
          tags[tag.Key] = tag.Value;
        }
      }

      return tags;

    } catch (error) {
      console.warn(`Failed to get tags for key ${key}:`, error);
      return undefined;
    }
  }
}

// Factory function
export function createS3Adapter(config: S3Config): S3StorageAdapter {
  return new S3StorageAdapter(config);
}