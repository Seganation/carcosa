// Complete Upload Progress & Resumable Upload Example
// The UploadThing Killer - Full Implementation! 🚀

import express from 'express';
import { 
  createProgressMiddleware, 
  setupProgressRoutes, 
  uploadCorsMiddleware,
  ProgressTrackingMiddleware 
} from '../src/progress-middleware';
import { createUploadRouter, f } from '../src/router';
import { createUrlRouter } from '../src/url-routing';

// Create upload router with progress support
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  sessionId?: string;
}>();

// Define routes with progress tracking
uploadRouter.addRouteFromBuilder(
  'profileImage',
  f.imageUploader<{ userId: string; projectId: string; sessionId?: string }>({ 
    maxFileSize: '4MB', 
    maxFileCount: 1 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!userId || !projectId) {
        throw new Error('User ID and Project ID required');
      }

      // Validate user has permission to upload
      // const hasPermission = await checkUploadPermission(userId, projectId);
      // if (!hasPermission) throw new Error('Upload permission denied');

      return { userId, projectId, sessionId };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Profile image uploaded by user ${metadata.userId}`);
      
      // Update user profile with new image
      // await updateUserProfile(metadata.userId, {
      //   profileImageKey: file.key,
      //   profileImageUrl: file.url,
      // });

      // Send notification
      // await sendNotification(metadata.userId, {
      //   type: 'profile_image_updated',
      //   message: 'Your profile image has been updated successfully!',
      // });

      return {
        success: true,
        profileUpdated: true,
        imageUrl: file.url,
        userId: metadata.userId,
      };
    })
);

// Batch document upload with progress
uploadRouter.addRouteFromBuilder(
  'documentBatch',
  f.documentUploader<{ userId: string; projectId: string; batchId: string }>({ 
    maxFileSize: '32MB', 
    maxFileCount: 20 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const batchId = req.headers['x-batch-id'] as string || `batch_${Date.now()}`;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      return { userId, projectId, batchId };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Document uploaded to batch ${metadata.batchId}`);

      // Process document
      // await processDocument(file.key, {
      //   batchId: metadata.batchId,
      //   userId: metadata.userId,
      //   projectId: metadata.projectId,
      // });

      return {
        batchId: metadata.batchId,
        documentProcessed: true,
        fileName: file.name,
      };
    })
);

// Large video upload with chunking
uploadRouter.addRouteFromBuilder(
  'videoUpload',
  f.videoUploader<{ userId: string; projectId: string; videoId: string }>({ 
    maxFileSize: '2GB', 
    maxFileCount: 1 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const videoId = req.headers['x-video-id'] as string || `video_${Date.now()}`;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      // Check storage quota for large files
      // const quota = await checkStorageQuota(userId, projectId);
      // if (!quota.canUploadLargeFile) {
      //   throw new Error('Storage quota exceeded for large files');
      // }

      return { userId, projectId, videoId };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Video uploaded: ${metadata.videoId}`);

      // Queue video processing
      // await queueVideoProcessing(file.key, {
      //   videoId: metadata.videoId,
      //   userId: metadata.userId,
      //   projectId: metadata.projectId,
      //   formats: ['720p', '1080p'],
      //   thumbnails: true,
      // });

      return {
        videoId: metadata.videoId,
        processingQueued: true,
        estimatedProcessingTime: '5-10 minutes',
      };
    })
);

// Create progress middleware
const progressMiddleware = createProgressMiddleware({
  enableProgress: true,
  enableResumable: true,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  maxRetries: 3,
  enableWebSocket: false, // Set to true if you have WebSocket server
  corsOrigin: ['http://localhost:3000', 'https://yourdomain.com'],
});

// Create file serving router
const fileServingRouter = createUrlRouter({
  baseUrl: 'https://api.yourdomain.com',
  cdnUrl: 'https://cdn.yourdomain.com',
  projectId: 'default',
  enablePublicFiles: true,
  enableTransforms: true,
  enableSignedFiles: true,
}, uploadRouter);

// Express app setup
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// CORS for upload endpoints
app.use('/api/upload', uploadCorsMiddleware(['http://localhost:3000', 'https://yourdomain.com']));

// Upload progress routes
app.use('/api/upload/progress', setupProgressRoutes(progressMiddleware));

// File serving routes
app.use('/files', fileServingRouter.getRouter());

// Traditional upload routes (for compatibility)
app.post('/api/upload/init', async (req, res, next) => {
  try {
    const { routeName, metadata, fileName, fileSize } = req.body;
    
    // Get route from upload router
    const route = uploadRouter.getRoute(routeName);
    if (!route) {
      return res.status(404).json({ error: `Route ${routeName} not found` });
    }

    // Run middleware if defined
    let processedMetadata = metadata || {};
    if (route.middleware) {
      const ctx = {
        req,
        res,
        params: req.params,
        query: req.query as Record<string, string>,
        headers: req.headers as Record<string, string>,
        metadata: processedMetadata,
      };
      
      try {
        processedMetadata = await route.middleware(ctx);
      } catch (error) {
        return res.status(401).json({ 
          error: 'Middleware validation failed', 
          details: (error as Error).message 
        });
      }
    }

    // Initialize progress tracking upload
    req.body = { ...req.body, metadata: processedMetadata };
    await progressMiddleware.initializeUpload(req, res, next);

  } catch (error) {
    next(error);
  }
});

// Upload completion endpoint
app.post('/api/upload/complete', async (req, res, next) => {
  try {
    const { uploadId, routeName, fileKey, fileInfo } = req.body;
    
    // Get route from upload router
    const route = uploadRouter.getRoute(routeName);
    if (!route) {
      return res.status(404).json({ error: `Route ${routeName} not found` });
    }

    // Get upload progress
    const progress = progressMiddleware.getUploadManager().getProgress(uploadId);
    if (!progress) {
      return res.status(404).json({ error: 'Upload session not found' });
    }

    // Create file object
    const file = {
      key: fileKey,
      name: fileInfo?.name || progress.fileName,
      size: fileInfo?.size || progress.fileSize,
      type: fileInfo?.type || 'application/octet-stream',
      uploadedAt: new Date(),
      url: `https://files.yourdomain.com/f/default/${fileKey}`,
      metadata: fileInfo?.metadata,
    };

    // Run upload completion handler if defined
    if (route.onUploadComplete) {
      const ctx = {
        metadata: req.body.metadata || {},
        file,
        userId: req.body.userId,
        projectId: req.body.projectId,
        organizationId: req.body.organizationId,
      };

      try {
        const result = await route.onUploadComplete(ctx);
        res.json({ success: true, file, result });
      } catch (error) {
        res.status(500).json({ 
          error: 'Upload completion handler failed', 
          details: (error as Error).message 
        });
      }
    } else {
      res.json({ success: true, file });
    }

  } catch (error) {
    next(error);
  }
});

// WebSocket setup for real-time progress (optional)
// const http = require('http');
// const socketIo = require('socket.io');
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: ['http://localhost:3000', 'https://yourdomain.com'],
//     methods: ['GET', 'POST']
//   }
// });

// io.on('connection', (socket) => {
//   console.log('Client connected for upload progress');
  
//   socket.on('subscribe-upload', (uploadId) => {
//     socket.join(`upload-${uploadId}`);
//   });
  
//   socket.on('unsubscribe-upload', (uploadId) => {
//     socket.leave(`upload-${uploadId}`);
//   });
// });

// Example WebSocket progress emission
// progressMiddleware.getUploadManager().addGlobalEventListener((event) => {
//   io.to(`upload-${event.uploadId}`).emit('upload-progress', {
//     uploadId: event.uploadId,
//     type: event.type,
//     progress: {
//       percentage: event.progress.percentage,
//       bytesUploaded: event.progress.bytesUploaded,
//       uploadSpeed: event.progress.uploadSpeed,
//       status: event.progress.status,
//     },
//   });
// });

// Health check with progress stats
app.get('/health', (req, res) => {
  const stats = progressMiddleware.getUploadManager().getStats();
  
  res.json({
    status: 'ok',
    service: 'carcosa-upload-progress',
    timestamp: new Date().toISOString(),
    upload_stats: stats,
    features: {
      progress_tracking: true,
      resumable_uploads: true,
      chunked_uploads: true,
      real_time_updates: false, // Set to true if WebSocket enabled
    },
    routes: Array.from(uploadRouter.getRoutes().keys()),
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Upload error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Carcosa Upload Progress Server running on port ${PORT}`);
  console.log(`📊 Progress tracking: ENABLED`);
  console.log(`🔄 Resumable uploads: ENABLED`);
  console.log(`📦 Chunked uploads: ENABLED (5MB chunks)`);
  console.log(`📁 Available routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
  console.log(`📈 Health check: http://localhost:${PORT}/health`);
});

export default app;