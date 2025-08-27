// Production Storage Integration Example
// The UploadThing Killer - Real Cloud Storage! 🚀

import express from 'express';
import { createStorageManager, createS3Adapter, createR2Adapter } from '../src/storage';
import { createUploadRouter, f } from '../src/router';
import { createProgressMiddleware, setupProgressRoutes } from '../src/progress-middleware';

// Production configuration
const PRODUCTION_CONFIG = {
  // S3 Configuration (for enterprise users and large files)
  s3: {
    provider: 's3' as const,
    bucket: process.env.S3_BUCKET || 'carcosa-enterprise',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    options: {
      maxRetries: 5,
      timeout: 300000, // 5 minutes
    },
  },

  // R2 Configuration (for cost optimization and global distribution)
  r2: {
    provider: 'r2' as const,
    bucket: process.env.R2_BUCKET || 'carcosa-optimized',
    accountId: process.env.R2_ACCOUNT_ID!,
    endpoint: process.env.R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    options: {
      maxRetries: 3,
      timeout: 300000, // 5 minutes
      publicUrl: process.env.R2_PUBLIC_URL || 'https://files.yourdomain.com',
    },
  },
};

// Create storage manager
const storageManager = createStorageManager();

// Initialize storage providers
async function initializeStorage() {
  try {
    console.log('🚀 Initializing production storage providers...');

    // Add S3 provider
    if (PRODUCTION_CONFIG.s3.credentials.accessKeyId) {
      await storageManager.addProvider('s3', PRODUCTION_CONFIG.s3);
      console.log('✅ S3 storage provider initialized');
    } else {
      console.log('⚠️ S3 credentials not provided, skipping S3 provider');
    }

    // Add R2 provider
    if (PRODUCTION_CONFIG.r2.credentials.accessKeyId) {
      await storageManager.addProvider('r2', PRODUCTION_CONFIG.r2);
      console.log('✅ R2 storage provider initialized');
      console.log('💰 R2 Cost Savings: ~80% cheaper than S3!');
    } else {
      console.log('⚠️ R2 credentials not provided, skipping R2 provider');
    }

    // Set default provider (R2 if available, otherwise S3)
    if (storageManager.getAllProviders().has('r2')) {
      storageManager.setDefaultProvider('r2');
    } else if (storageManager.getAllProviders().has('s3')) {
      storageManager.setDefaultProvider('s3');
    } else {
      throw new Error('No storage providers available');
    }

    // Add cost-optimization strategy
    storageManager.addStrategy({
      name: 'cost-optimization',
      description: 'Route files to most cost-effective storage',
      enabled: true,
      rules: [
        {
          condition: 'file-size',
          operator: 'lt',
          value: 100 * 1024 * 1024, // 100MB
          provider: 'r2', // Use R2 for smaller files
          priority: 1,
        },
        {
          condition: 'file-size',
          operator: 'gte',
          value: 100 * 1024 * 1024, // 100MB
          provider: 's3', // Use S3 for larger files
          priority: 2,
        },
        {
          condition: 'user-tier',
          operator: 'eq',
          value: 'enterprise',
          provider: 's3', // Enterprise users get S3
          priority: 1,
        },
      ],
    });

    console.log('📋 Storage strategies configured');
    console.log(`🎯 Default provider: ${storageManager.getDefaultProvider()}`);

  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    throw error;
  }
}

// Create upload router with storage integration
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  organizationId: string;
  userTier: 'free' | 'pro' | 'enterprise';
  fileType: string;
  metadata?: Record<string, any>;
}>();

// Profile image upload with storage optimization
uploadRouter.addRouteFromBuilder(
  'profileImage',
  f.imageUploader<{
    userId: string;
    projectId: string;
    organizationId: string;
    userTier: 'free' | 'pro' | 'enterprise';
    fileType: string;
  }>({ 
    maxFileSize: '4MB', 
    maxFileCount: 1 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const organizationId = req.headers['x-organization-id'] as string;
      const userTier = (req.headers['x-user-tier'] as 'free' | 'pro' | 'enterprise') || 'free';
      const fileType = req.headers['x-file-type'] as string || 'image';
      
      if (!userId || !projectId || !organizationId) {
        throw new Error('User ID, Project ID, and Organization ID required');
      }

      // Validate user permissions
      // const hasPermission = await checkUploadPermission(userId, projectId, organizationId);
      // if (!hasPermission) throw new Error('Upload permission denied');

      return { 
        userId, 
        projectId, 
        organizationId, 
        userTier,
        fileType,
      };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Profile image uploaded by user ${metadata.userId}`);
      
      // Update user profile with new image
      // await updateUserProfile(metadata.userId, {
      //   profileImageKey: file.key,
      //   profileImageUrl: file.url,
      //   storageProvider: file.storageProvider,
      // });

      return {
        success: true,
        profileUpdated: true,
        imageUrl: file.url,
        userId: metadata.userId,
        storageProvider: file.storageProvider,
        costSavings: file.costSavings,
      };
    })
);

// Large video upload with intelligent storage routing
uploadRouter.addRouteFromBuilder(
  'videoUpload',
  f.videoUploader<{
    userId: string;
    projectId: string;
    organizationId: string;
    userTier: 'free' | 'pro' | 'enterprise';
    fileType: string;
  }>({ 
    maxFileSize: '2GB', 
    maxFileCount: 1 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const organizationId = req.headers['x-organization-id'] as string;
      const userTier = (req.headers['x-user-tier'] as 'free' | 'pro' | 'enterprise') || 'free';
      const fileType = req.headers['x-file-type'] as string || 'video';
      
      if (!userId || !projectId || !organizationId) {
        throw new Error('User ID, Project ID, and Organization ID required');
      }

      // Check storage quota for large files
      // const quota = await checkStorageQuota(userId, projectId, organizationId);
      // if (!quota.canUploadLargeFile) {
      //   throw new Error('Storage quota exceeded for large files');
      // }

      return { 
        userId, 
        projectId, 
        organizationId, 
        userTier,
        fileType,
      };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Video uploaded: ${file.key} by user ${metadata.userId}`);

      // Queue video processing based on storage provider
      // await queueVideoProcessing(file.key, {
      //   videoId: file.key,
      //   userId: metadata.userId,
      //   projectId: metadata.projectId,
      //   organizationId: metadata.organizationId,
      //   storageProvider: file.storageProvider,
      //   formats: ['720p', '1080p'],
      //   thumbnails: true,
      // });

      return {
        videoId: file.key,
        processingQueued: true,
        estimatedProcessingTime: '5-10 minutes',
        storageProvider: file.storageProvider,
        costSavings: file.costSavings,
      };
    })
);

// Batch document upload with storage optimization
uploadRouter.addRouteFromBuilder(
  'documentBatch',
  f.documentUploader<{
    userId: string;
    projectId: string;
    organizationId: string;
    userTier: 'free' | 'pro' | 'enterprise';
    fileType: string;
    batchId: string;
  }>({ 
    maxFileSize: '32MB', 
    maxFileCount: 20 
  })
    .addMiddleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      const organizationId = req.headers['x-organization-id'] as string;
      const userTier = (req.headers['x-user-tier'] as 'free' | 'pro' | 'enterprise') || 'free';
      const fileType = req.headers['x-file-type'] as string || 'document';
      const batchId = req.headers['x-batch-id'] as string || `batch_${Date.now()}`;
      
      if (!userId || !projectId || !organizationId) {
        throw new Error('User ID, Project ID, and Organization ID required');
      }

      return { 
        userId, 
        projectId, 
        organizationId, 
        userTier,
        fileType,
        batchId,
      };
    })
    .addUploadCompleteHandler(async ({ metadata, file }) => {
      console.log(`Document uploaded to batch ${metadata.batchId}`);

      // Process document based on storage provider
      // await processDocument(file.key, {
      //   batchId: metadata.batchId,
      //   userId: metadata.userId,
      //   projectId: metadata.projectId,
      //   organizationId: metadata.organizationId,
      //   storageProvider: file.storageProvider,
      // });

      return {
        batchId: metadata.batchId,
        documentProcessed: true,
        fileName: file.name,
        storageProvider: file.storageProvider,
        costSavings: file.costSavings,
      };
    })
);

// Create progress middleware with storage integration
const progressMiddleware = createProgressMiddleware({
  enableProgress: true,
  enableResumable: true,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  maxRetries: 3,
  enableWebSocket: false,
  corsOrigin: ['http://localhost:3000', 'https://yourdomain.com'],
});

// Express app setup
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// CORS for upload endpoints
app.use('/api/upload', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Range, X-Upload-Id, X-User-Id, X-Project-Id, X-Organization-Id, X-User-Tier, X-File-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Upload progress routes
app.use('/api/upload/progress', setupProgressRoutes(progressMiddleware));

// Storage management routes
app.get('/api/storage/providers', (req, res) => {
  const providers = Array.from(storageManager.getAllProviders().entries()).map(([name, adapter]) => ({
    name,
    info: adapter.getAdapterInfo(),
    ready: adapter.isReady(),
  }));
  
  res.json({
    providers,
    defaultProvider: storageManager.getDefaultProvider(),
    strategies: Array.from(storageManager.getStrategy('cost-optimization')?.rules || []),
  });
});

app.get('/api/storage/stats', async (req, res) => {
  try {
    const stats = await storageManager.getOverallStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/storage/costs', async (req, res) => {
  try {
    const costs = await storageManager.getStorageCosts();
    res.json(costs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/storage/health', async (req, res) => {
  try {
    const health = await storageManager.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Initialize upload with storage allocation
app.post('/api/upload/init', async (req, res, next) => {
  try {
    const { routeName, fileName, fileSize, metadata } = req.body;
    
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

    // Allocate storage
    const allocation = await storageManager.allocateStorage(fileName, fileSize, {
      organizationId: processedMetadata.organizationId,
      projectId: processedMetadata.projectId,
      userId: processedMetadata.userId,
      fileType: processedMetadata.fileType,
      userTier: processedMetadata.userTier,
    });

    // Generate presigned upload URL
    const presignedUrl = await storageManager.generatePresignedUploadUrl(fileName, fileSize, {
      organizationId: processedMetadata.organizationId,
      projectId: processedMetadata.projectId,
      userId: processedMetadata.userId,
      fileType: processedMetadata.fileType,
      userTier: processedMetadata.userTier,
    });

    // Initialize progress tracking upload
    req.body = { 
      ...req.body, 
      metadata: processedMetadata,
      storageAllocation: allocation,
      presignedUrl: presignedUrl.url,
    };
    
    await progressMiddleware.initializeUpload(req, res, next);

  } catch (error) {
    next(error);
  }
});

// Upload completion with storage integration
app.post('/api/upload/complete', async (req, res, next) => {
  try {
    const { uploadId, routeName, fileKey, fileInfo, storageAllocation } = req.body;
    
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

    // Create file object with storage information
    const file = {
      key: fileKey,
      name: fileInfo?.name || progress.fileName,
      size: fileInfo?.size || progress.fileSize,
      type: fileInfo?.type || 'application/octet-stream',
      uploadedAt: new Date(),
      url: storageAllocation?.url || `https://files.yourdomain.com/f/default/${fileKey}`,
      storageProvider: storageAllocation?.provider || 'unknown',
      costSavings: storageAllocation?.cost?.total || 0,
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
async function startServer() {
  try {
    // Initialize storage first
    await initializeStorage();
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Carcosa Production Storage Server running on port ${PORT}`);
      console.log(`📊 Progress tracking: ENABLED`);
      console.log(`🔄 Resumable uploads: ENABLED`);
      console.log(`📦 Chunked uploads: ENABLED (5MB chunks)`);
      console.log(`☁️ Storage providers: ${Array.from(storageManager.getAllProviders().keys()).join(', ')}`);
      console.log(`📁 Available routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
      console.log(`💰 Cost optimization: ENABLED`);
      console.log(`📈 Health check: http://localhost:${PORT}/api/storage/health`);
      console.log(`📊 Storage stats: http://localhost:${PORT}/api/storage/stats`);
      console.log(`💸 Cost analysis: http://localhost:${PORT}/api/storage/costs`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;