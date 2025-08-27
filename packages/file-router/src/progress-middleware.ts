// Express Middleware for Upload Progress & Resumable Uploads
// The UploadThing Killer - Server Integration! 🚀

import { Request, Response, NextFunction } from 'express';
import { UploadProgressManager, UploadProgress, createUploadProgressManager } from './upload-progress';

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      uploadManager?: UploadProgressManager;
      uploadProgress?: UploadProgress;
    }
  }
}

// Progress middleware configuration
export interface ProgressMiddlewareConfig {
  enableProgress: boolean;
  enableResumable: boolean;
  chunkSize: number;
  maxRetries: number;
  enableWebSocket?: boolean;
  webSocketPath?: string;
  corsOrigin?: string | string[];
}

// Upload chunk information
export interface UploadChunk {
  uploadId: string;
  chunkNumber: number;
  chunkSize: number;
  totalChunks: number;
  fileSize: number;
  fileName: string;
  fileKey: string;
  contentRange?: string;
  lastChunk: boolean;
}

// Progress tracking middleware
export class ProgressTrackingMiddleware {
  private uploadManager: UploadProgressManager;
  private config: ProgressMiddlewareConfig;
  private webSocketServer?: any; // WebSocket server for real-time updates

  constructor(config: Partial<ProgressMiddlewareConfig> = {}) {
    this.config = {
      enableProgress: true,
      enableResumable: true,
      chunkSize: 5 * 1024 * 1024, // 5MB
      maxRetries: 3,
      enableWebSocket: false,
      webSocketPath: '/upload-progress',
      corsOrigin: '*',
      ...config,
    };

    this.uploadManager = createUploadProgressManager({
      chunkSize: this.config.chunkSize,
      maxRetries: this.config.maxRetries,
      enableResumable: this.config.enableResumable,
      enableProgress: this.config.enableProgress,
    });
  }

  // Initialize upload session
  initializeUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName, fileSize, chunkSize, routeName, metadata } = req.body;

      if (!fileName || !fileSize) {
        return res.status(400).json({
          error: 'fileName and fileSize are required',
        });
      }

      // Generate upload ID and file key
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileKey = `${uploadId}_${fileName}`;

      // Create upload session
      const progress = this.uploadManager.createUpload(uploadId, fileKey, fileName, fileSize);

      // Calculate chunks
      const totalChunks = Math.ceil(fileSize / (chunkSize || this.config.chunkSize));

      // Generate chunk upload URLs (presigned URLs for direct storage upload)
      const chunkUrls = await this.generateChunkUrls(uploadId, fileKey, totalChunks, routeName);

      res.json({
        uploadId,
        fileKey,
        chunkSize: chunkSize || this.config.chunkSize,
        totalChunks,
        chunkUrls,
        resumable: this.config.enableResumable,
        progress: this.config.enableProgress,
        metadata: {
          routeName,
          ...metadata,
        },
      });

    } catch (error) {
      next(error);
    }
  };

  // Handle chunk upload completion
  handleChunkUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chunkInfo = this.parseChunkInfo(req);
      
      if (!chunkInfo) {
        return res.status(400).json({
          error: 'Invalid chunk information',
        });
      }

      const progress = this.uploadManager.getProgress(chunkInfo.uploadId);
      if (!progress) {
        return res.status(404).json({
          error: 'Upload session not found',
        });
      }

      // Update progress
      const bytesUploaded = (chunkInfo.chunkNumber + 1) * chunkInfo.chunkSize;
      progress.bytesUploaded = Math.min(bytesUploaded, progress.fileSize);
      progress.bytesRemaining = progress.fileSize - progress.bytesUploaded;
      progress.percentage = Math.round((progress.bytesUploaded / progress.fileSize) * 100);
      progress.currentChunk = chunkInfo.chunkNumber;
      progress.lastUpdateTime = Date.now();

      // Calculate upload speed
      const timeDiff = Date.now() - progress.startTime;
      if (timeDiff > 0) {
        progress.uploadSpeed = (progress.bytesUploaded / timeDiff) * 1000; // bytes per second
      }

      // Calculate ETA
      if (progress.uploadSpeed > 0 && progress.bytesRemaining > 0) {
        progress.estimatedTimeRemaining = Math.round(progress.bytesRemaining / progress.uploadSpeed * 1000);
      }

      // Check if upload is complete
      if (chunkInfo.lastChunk || progress.currentChunk >= progress.totalChunks - 1) {
        progress.status = 'completed';
        progress.percentage = 100;
        progress.bytesUploaded = progress.fileSize;
        progress.bytesRemaining = 0;

        // Trigger completion handlers
        await this.handleUploadCompletion(progress);
      }

      // Emit progress event
      this.emitProgressUpdate(progress);

      res.json({
        success: true,
        uploadId: chunkInfo.uploadId,
        chunkNumber: chunkInfo.chunkNumber,
        progress: {
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          bytesRemaining: progress.bytesRemaining,
          uploadSpeed: progress.uploadSpeed,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          status: progress.status,
        },
        completed: progress.status === 'completed',
      });

    } catch (error) {
      next(error);
    }
  };

  // Handle upload resumption
  resumeUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      
      const progress = this.uploadManager.getProgress(uploadId);
      if (!progress) {
        return res.status(404).json({
          error: 'Upload session not found',
        });
      }

      // Calculate which chunks are missing
      const missingChunks = this.calculateMissingChunks(progress);
      
      // Generate URLs for missing chunks
      const chunkUrls = await this.generateChunkUrls(
        uploadId, 
        progress.fileKey, 
        progress.totalChunks,
        undefined, // routeName - would need to be stored in progress
        missingChunks
      );

      res.json({
        uploadId,
        fileKey: progress.fileKey,
        resumeFromChunk: progress.currentChunk,
        missingChunks,
        chunkUrls,
        progress: {
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          status: progress.status,
        },
      });

    } catch (error) {
      next(error);
    }
  };

  // Get upload progress
  getProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      
      const progress = this.uploadManager.getProgress(uploadId);
      if (!progress) {
        return res.status(404).json({
          error: 'Upload session not found',
        });
      }

      res.json({
        uploadId,
        progress: {
          fileName: progress.fileName,
          fileSize: progress.fileSize,
          bytesUploaded: progress.bytesUploaded,
          bytesRemaining: progress.bytesRemaining,
          percentage: progress.percentage,
          uploadSpeed: progress.uploadSpeed,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          status: progress.status,
          currentChunk: progress.currentChunk,
          totalChunks: progress.totalChunks,
          startTime: progress.startTime,
          lastUpdateTime: progress.lastUpdateTime,
          retryCount: progress.retryCount,
          error: progress.error,
        },
      });

    } catch (error) {
      next(error);
    }
  };

  // Cancel upload
  cancelUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      
      this.uploadManager.cancelUpload(uploadId);

      res.json({
        success: true,
        uploadId,
        status: 'cancelled',
      });

    } catch (error) {
      next(error);
    }
  };

  // Get upload statistics
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = this.uploadManager.getStats();
      
      res.json({
        stats,
        timestamp: Date.now(),
      });

    } catch (error) {
      next(error);
    }
  };

  // Parse chunk information from request
  private parseChunkInfo(req: Request): UploadChunk | null {
    const { uploadId, chunkNumber, totalChunks, fileName, fileKey } = req.body;
    const contentRange = req.headers['content-range'] as string;

    if (!uploadId || chunkNumber === undefined || !totalChunks) {
      return null;
    }

    // Parse content range if available (for resumable uploads)
    let chunkSize = 0;
    if (contentRange) {
      const match = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        chunkSize = end - start + 1;
      }
    }

    return {
      uploadId,
      chunkNumber: parseInt(chunkNumber),
      chunkSize: chunkSize || req.body.chunkSize || this.config.chunkSize,
      totalChunks: parseInt(totalChunks),
      fileSize: req.body.fileSize || 0,
      fileName: fileName || 'unknown',
      fileKey: fileKey || uploadId,
      contentRange,
      lastChunk: parseInt(chunkNumber) >= parseInt(totalChunks) - 1,
    };
  }

  // Generate presigned URLs for chunk uploads
  private async generateChunkUrls(
    uploadId: string,
    fileKey: string,
    totalChunks: number,
    routeName?: string,
    specificChunks?: number[]
  ): Promise<string[]> {
    // TODO: Integrate with actual storage service (S3/R2/GCS)
    // This should generate presigned PUT URLs for each chunk
    
    const chunks = specificChunks || Array.from({ length: totalChunks }, (_, i) => i);
    
    return chunks.map(chunkNumber => 
      `https://api.carcosa.com/upload/${uploadId}/chunk/${chunkNumber}?token=${Date.now()}`
    );
  }

  // Calculate missing chunks for resumable uploads
  private calculateMissingChunks(progress: UploadProgress): number[] {
    const missingChunks: number[] = [];
    
    for (let i = progress.currentChunk; i < progress.totalChunks; i++) {
      missingChunks.push(i);
    }
    
    return missingChunks;
  }

  // Handle upload completion
  private async handleUploadCompletion(progress: UploadProgress): Promise<void> {
    // TODO: Trigger upload completion handlers from the file router
    // This would call the onUploadComplete handlers defined in routes
    
    console.log(`Upload completed: ${progress.fileKey}`);
  }

  // Emit progress update (WebSocket or SSE)
  private emitProgressUpdate(progress: UploadProgress): void {
    if (this.config.enableWebSocket && this.webSocketServer) {
      // TODO: Implement WebSocket progress updates
      this.webSocketServer.emit('upload-progress', {
        uploadId: progress.uploadId,
        progress: {
          percentage: progress.percentage,
          bytesUploaded: progress.bytesUploaded,
          uploadSpeed: progress.uploadSpeed,
          status: progress.status,
        },
      });
    }
  }

  // Get the upload manager instance
  getUploadManager(): UploadProgressManager {
    return this.uploadManager;
  }
}

// Factory function to create progress middleware
export function createProgressMiddleware(config?: Partial<ProgressMiddlewareConfig>): ProgressTrackingMiddleware {
  return new ProgressTrackingMiddleware(config);
}

// Express router setup helper
export function setupProgressRoutes(middleware: ProgressTrackingMiddleware) {
  const router = require('express').Router();

  // Initialize upload
  router.post('/init', middleware.initializeUpload);

  // Handle chunk upload completion
  router.post('/chunk', middleware.handleChunkUpload);

  // Resume upload
  router.get('/:uploadId/resume', middleware.resumeUpload);

  // Get progress
  router.get('/:uploadId/progress', middleware.getProgress);

  // Cancel upload
  router.delete('/:uploadId', middleware.cancelUpload);

  // Get statistics
  router.get('/stats', middleware.getStats);

  return router;
}

// CORS middleware for upload endpoints
export function uploadCorsMiddleware(origins: string | string[] = '*') {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (origins === '*') {
      res.header('Access-Control-Allow-Origin', '*');
    } else if (Array.isArray(origins)) {
      if (origin && origins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else if (origins === origin) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Range, X-Upload-Id');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Upload-Progress');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
}