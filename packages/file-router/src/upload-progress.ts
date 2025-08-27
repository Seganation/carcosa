// Upload Progress & Resumable Upload System
// The UploadThing Killer - Advanced Upload Management! 🚀

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';

// Upload progress data
export interface UploadProgress {
  uploadId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  bytesUploaded: number;
  bytesRemaining: number;
  percentage: number;
  uploadSpeed: number; // bytes per second
  estimatedTimeRemaining: number; // milliseconds
  status: UploadStatus;
  chunkSize: number;
  currentChunk: number;
  totalChunks: number;
  startTime: number;
  lastUpdateTime: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

// Upload configuration
export interface UploadConfig {
  chunkSize: number; // Default 5MB chunks
  maxRetries: number; // Default 3 retries
  retryDelay: number; // Base retry delay in ms
  enableResumable: boolean; // Enable resumable uploads
  enableProgress: boolean; // Enable progress tracking
  progressUpdateInterval: number; // Progress update frequency in ms
  maxConcurrentUploads: number; // Max parallel uploads
  timeoutMs: number; // Upload timeout
}

// Upload event types
export type UploadEventType = 
  | 'progress' 
  | 'chunk-uploaded' 
  | 'paused' 
  | 'resumed' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'retry';

// Upload event data
export interface UploadEvent {
  type: UploadEventType;
  uploadId: string;
  progress: UploadProgress;
  data?: any;
  timestamp: number;
}

// Upload event listener
export type UploadEventListener = (event: UploadEvent) => void;

// Upload manager class
export class UploadProgressManager {
  private uploads: Map<string, UploadProgress> = new Map();
  private listeners: Map<string, UploadEventListener[]> = new Map();
  private activeUploads: Set<string> = new Set();
  private config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = {
      chunkSize: 5 * 1024 * 1024, // 5MB
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      enableResumable: true,
      enableProgress: true,
      progressUpdateInterval: 100, // 100ms
      maxConcurrentUploads: 3,
      timeoutMs: 300000, // 5 minutes
      ...config,
    };
  }

  // Create a new upload session
  createUpload(
    uploadId: string,
    fileKey: string,
    fileName: string,
    fileSize: number
  ): UploadProgress {
    const totalChunks = Math.ceil(fileSize / this.config.chunkSize);
    
    const progress: UploadProgress = {
      uploadId,
      fileKey,
      fileName,
      fileSize,
      bytesUploaded: 0,
      bytesRemaining: fileSize,
      percentage: 0,
      uploadSpeed: 0,
      estimatedTimeRemaining: 0,
      status: 'pending',
      chunkSize: this.config.chunkSize,
      currentChunk: 0,
      totalChunks,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.uploads.set(uploadId, progress);
    this.emitEvent('progress', uploadId, progress);
    
    return progress;
  }

  // Start an upload
  async startUpload(uploadId: string): Promise<void> {
    const progress = this.uploads.get(uploadId);
    if (!progress) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    if (this.activeUploads.size >= this.config.maxConcurrentUploads) {
      throw new Error('Max concurrent uploads reached');
    }

    progress.status = 'uploading';
    progress.startTime = Date.now();
    this.activeUploads.add(uploadId);

    try {
      await this.performUpload(progress);
    } catch (error) {
      await this.handleUploadError(progress, error as Error);
    }
  }

  // Perform the actual upload with chunking
  private async performUpload(progress: UploadProgress): Promise<void> {
    while (progress.currentChunk < progress.totalChunks && progress.status === 'uploading') {
      try {
        await this.uploadChunk(progress);
        progress.currentChunk++;
        this.updateProgress(progress);
        
        this.emitEvent('chunk-uploaded', progress.uploadId, progress, {
          chunkNumber: progress.currentChunk,
          totalChunks: progress.totalChunks,
        });

      } catch (error) {
        throw error; // Let the error handler deal with retries
      }
    }

    if (progress.currentChunk >= progress.totalChunks) {
      progress.status = 'completed';
      progress.percentage = 100;
      this.activeUploads.delete(progress.uploadId);
      this.emitEvent('completed', progress.uploadId, progress);
    }
  }

  // Upload a single chunk
  private async uploadChunk(progress: UploadProgress): Promise<void> {
    const startByte = progress.currentChunk * progress.chunkSize;
    const endByte = Math.min(startByte + progress.chunkSize, progress.fileSize);
    const chunkData = { startByte, endByte, size: endByte - startByte };

    // TODO: Implement actual chunk upload to storage
    // This would typically be a PUT request to S3/R2 with Range headers
    await this.simulateChunkUpload(chunkData, progress);

    // Update bytes uploaded
    progress.bytesUploaded = endByte;
    progress.bytesRemaining = progress.fileSize - progress.bytesUploaded;
  }

  // Simulate chunk upload (replace with real implementation)
  private async simulateChunkUpload(
    chunkData: { startByte: number; endByte: number; size: number },
    progress: UploadProgress
  ): Promise<void> {
    // Simulate network delay
    const delay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional network errors
    if (Math.random() < 0.05) { // 5% chance of error
      throw new Error('Network error during chunk upload');
    }
  }

  // Update upload progress metrics
  private updateProgress(progress: UploadProgress): void {
    const now = Date.now();
    const timeDiff = now - progress.lastUpdateTime;
    
    // Calculate upload speed
    if (timeDiff > 0) {
      const bytesDiff = progress.bytesUploaded - (progress.bytesUploaded - progress.chunkSize);
      progress.uploadSpeed = (bytesDiff / timeDiff) * 1000; // bytes per second
    }

    // Calculate percentage
    progress.percentage = Math.round((progress.bytesUploaded / progress.fileSize) * 100);

    // Calculate ETA
    if (progress.uploadSpeed > 0 && progress.bytesRemaining > 0) {
      progress.estimatedTimeRemaining = Math.round(progress.bytesRemaining / progress.uploadSpeed * 1000);
    }

    progress.lastUpdateTime = now;

    if (this.config.enableProgress) {
      this.emitEvent('progress', progress.uploadId, progress);
    }
  }

  // Handle upload errors with retry logic
  private async handleUploadError(progress: UploadProgress, error: Error): Promise<void> {
    progress.retryCount++;
    progress.error = error.message;

    if (progress.retryCount <= progress.maxRetries) {
      // Exponential backoff retry
      const delay = this.config.retryDelay * Math.pow(2, progress.retryCount - 1);
      
      this.emitEvent('retry', progress.uploadId, progress, {
        attempt: progress.retryCount,
        maxRetries: progress.maxRetries,
        delay,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Reset status and try again
      progress.status = 'uploading';
      await this.performUpload(progress);
      
    } else {
      // Max retries exceeded
      progress.status = 'failed';
      this.activeUploads.delete(progress.uploadId);
      this.emitEvent('failed', progress.uploadId, progress, { error: error.message });
    }
  }

  // Pause an upload
  pauseUpload(uploadId: string): void {
    const progress = this.uploads.get(uploadId);
    if (progress && progress.status === 'uploading') {
      progress.status = 'paused';
      this.activeUploads.delete(uploadId);
      this.emitEvent('paused', uploadId, progress);
    }
  }

  // Resume a paused upload
  async resumeUpload(uploadId: string): Promise<void> {
    const progress = this.uploads.get(uploadId);
    if (progress && progress.status === 'paused') {
      await this.startUpload(uploadId);
      this.emitEvent('resumed', uploadId, progress);
    }
  }

  // Cancel an upload
  cancelUpload(uploadId: string): void {
    const progress = this.uploads.get(uploadId);
    if (progress) {
      progress.status = 'cancelled';
      this.activeUploads.delete(uploadId);
      this.emitEvent('cancelled', uploadId, progress);
    }
  }

  // Get upload progress
  getProgress(uploadId: string): UploadProgress | undefined {
    return this.uploads.get(uploadId);
  }

  // Get all uploads
  getAllUploads(): UploadProgress[] {
    return Array.from(this.uploads.values());
  }

  // Get active uploads
  getActiveUploads(): UploadProgress[] {
    return Array.from(this.uploads.values()).filter(
      upload => upload.status === 'uploading'
    );
  }

  // Add event listener
  addEventListener(uploadId: string, listener: UploadEventListener): void {
    if (!this.listeners.has(uploadId)) {
      this.listeners.set(uploadId, []);
    }
    this.listeners.get(uploadId)!.push(listener);
  }

  // Remove event listener
  removeEventListener(uploadId: string, listener: UploadEventListener): void {
    const listeners = this.listeners.get(uploadId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Add global event listener (for all uploads)
  addGlobalEventListener(listener: UploadEventListener): void {
    this.addEventListener('*', listener);
  }

  // Emit event to listeners
  private emitEvent(
    type: UploadEventType,
    uploadId: string,
    progress: UploadProgress,
    data?: any
  ): void {
    const event: UploadEvent = {
      type,
      uploadId,
      progress,
      data,
      timestamp: Date.now(),
    };

    // Emit to specific upload listeners
    const uploadListeners = this.listeners.get(uploadId) || [];
    uploadListeners.forEach(listener => listener(event));

    // Emit to global listeners
    const globalListeners = this.listeners.get('*') || [];
    globalListeners.forEach(listener => listener(event));
  }

  // Clean up completed/failed uploads
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    
    for (const [uploadId, progress] of this.uploads) {
      if (
        (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') &&
        progress.lastUpdateTime < cutoffTime
      ) {
        this.uploads.delete(uploadId);
        this.listeners.delete(uploadId);
      }
    }
  }

  // Get upload statistics
  getStats(): {
    total: number;
    pending: number;
    uploading: number;
    paused: number;
    completed: number;
    failed: number;
    cancelled: number;
    activeCount: number;
    totalBytesUploaded: number;
    averageSpeed: number;
  } {
    const uploads = Array.from(this.uploads.values());
    
    return {
      total: uploads.length,
      pending: uploads.filter(u => u.status === 'pending').length,
      uploading: uploads.filter(u => u.status === 'uploading').length,
      paused: uploads.filter(u => u.status === 'paused').length,
      completed: uploads.filter(u => u.status === 'completed').length,
      failed: uploads.filter(u => u.status === 'failed').length,
      cancelled: uploads.filter(u => u.status === 'cancelled').length,
      activeCount: this.activeUploads.size,
      totalBytesUploaded: uploads.reduce((sum, u) => sum + u.bytesUploaded, 0),
      averageSpeed: uploads.length > 0 
        ? uploads.reduce((sum, u) => sum + u.uploadSpeed, 0) / uploads.length 
        : 0,
    };
  }
}

// Factory function to create upload manager
export function createUploadProgressManager(config?: Partial<UploadConfig>): UploadProgressManager {
  return new UploadProgressManager(config);
}

// Utility functions for formatting progress data
export const UploadUtils = {
  // Format bytes to human readable
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format speed to human readable
  formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  },

  // Format time to human readable
  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  // Generate unique upload ID
  generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Calculate overall progress for multiple uploads
  calculateOverallProgress(uploads: UploadProgress[]): {
    percentage: number;
    totalBytes: number;
    uploadedBytes: number;
    remainingBytes: number;
    averageSpeed: number;
    estimatedTimeRemaining: number;
  } {
    const totalBytes = uploads.reduce((sum, u) => sum + u.fileSize, 0);
    const uploadedBytes = uploads.reduce((sum, u) => sum + u.bytesUploaded, 0);
    const remainingBytes = totalBytes - uploadedBytes;
    const averageSpeed = uploads.length > 0 
      ? uploads.reduce((sum, u) => sum + u.uploadSpeed, 0) / uploads.length 
      : 0;

    return {
      percentage: totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0,
      totalBytes,
      uploadedBytes,
      remainingBytes,
      averageSpeed,
      estimatedTimeRemaining: averageSpeed > 0 ? Math.round(remainingBytes / averageSpeed * 1000) : 0,
    };
  },
};