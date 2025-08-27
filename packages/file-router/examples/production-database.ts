// Production Database Integration Example
// The Brain Behind The Beast - Complete File Management! 🗄️🚀

import express from 'express';
import { createDatabaseService, createStorageManager, createS3Adapter, createR2Adapter } from '../src';
import { createUploadRouter, f } from '../src/router';
import { createProgressMiddleware, setupProgressRoutes } from '../src/progress-middleware';

// Production configuration
const PRODUCTION_CONFIG = {
  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Storage providers
  s3: {
    provider: 's3' as const,
    bucket: process.env.S3_BUCKET || 'carcosa-enterprise',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  },

  r2: {
    provider: 'r2' as const,
    bucket: process.env.R2_BUCKET || 'carcosa-optimized',
    accountId: process.env.R2_ACCOUNT_ID!,
    endpoint: process.env.R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  },
};

// Initialize services
const databaseService = createDatabaseService();
const storageManager = createStorageManager();

// Initialize storage providers
async function initializeStorage() {
  try {
    console.log('🚀 Initializing production storage providers...');

    if (PRODUCTION_CONFIG.s3.credentials.accessKeyId) {
      await storageManager.addProvider('s3', PRODUCTION_CONFIG.s3);
      console.log('✅ S3 storage provider initialized');
    }

    if (PRODUCTION_CONFIG.r2.credentials.accessKeyId) {
      await storageManager.addProvider('r2', PRODUCTION_CONFIG.r2);
      console.log('✅ R2 storage provider initialized');
      console.log('💰 R2 Cost Savings: ~80% cheaper than S3!');
    }

    if (storageManager.getAllProviders().has('r2')) {
      storageManager.setDefaultProvider('r2');
    } else if (storageManager.getAllProviders().has('s3')) {
      storageManager.setDefaultProvider('s3');
    }

    console.log(`🎯 Default provider: ${storageManager.getDefaultProvider()}`);

  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    throw error;
  }
}

// Create upload router with database integration
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  organizationId: string;
  userTier: 'free' | 'pro' | 'enterprise';
  fileType: string;
  metadata?: Record<string, any>;
}>();

// Profile image upload with database tracking
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

      // Verify user exists and has access
      const user = await databaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const project = await databaseService.getProjectById(projectId);
      if (!project || project.organizationId !== organizationId) {
        throw new Error('Project not found or access denied');
      }

      // Check user quota
      const canUpload = await databaseService.checkUserQuota(
        userId, 
        organizationId, 
        'STORAGE', 
        BigInt(4 * 1024 * 1024) // 4MB
      );

      if (!canUpload) {
        throw new Error('Storage quota exceeded');
      }

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
      
      // Update user profile in database
      await databaseService.updateUser(metadata.userId, {
        avatar: file.url,
      });

      // Log the upload completion
      await databaseService.logAuditEvent({
        userId: metadata.userId,
        organizationId: metadata.organizationId,
        projectId: metadata.projectId,
        action: 'UPLOAD',
        resourceType: 'FILE',
        resourceId: file.id,
        details: { 
          fileName: file.name, 
          fileSize: file.size, 
          type: 'profile_image',
          storageProvider: file.storageProvider,
        },
      });

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

// Large video upload with database tracking and quota management
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
      const canUpload = await databaseService.checkUserQuota(
        userId, 
        organizationId, 
        'STORAGE', 
        BigInt(2 * 1024 * 1024 * 1024) // 2GB
      );

      if (!canUpload) {
        throw new Error('Storage quota exceeded for large files');
      }

      // Check upload quota
      const canUploadFile = await databaseService.checkUserQuota(
        userId, 
        organizationId, 
        'UPLOADS', 
        BigInt(1)
      );

      if (!canUploadFile) {
        throw new Error('Upload quota exceeded');
      }

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

      // Increment user quotas
      await databaseService.incrementUserQuota(
        metadata.userId, 
        metadata.organizationId, 
        'STORAGE', 
        file.size
      );

      await databaseService.incrementUserQuota(
        metadata.userId, 
        metadata.organizationId, 
        'UPLOADS', 
        BigInt(1)
      );

      // Log the upload completion
      await databaseService.logAuditEvent({
        userId: metadata.userId,
        organizationId: metadata.organizationId,
        projectId: metadata.projectId,
        action: 'UPLOAD',
        resourceType: 'FILE',
        resourceId: file.id,
        details: { 
          fileName: file.name, 
          fileSize: file.size, 
          type: 'video',
          storageProvider: file.storageProvider,
        },
      });

      return {
        videoId: file.key,
        processingQueued: true,
        estimatedProcessingTime: '5-10 minutes',
        storageProvider: file.storageProvider,
        costSavings: file.costSavings,
        quotaUsed: {
          storage: file.size,
          uploads: 1,
        },
      };
    })
);

// Create progress middleware with database integration
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

// Database management routes
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, tier } = req.body;
    const user = await databaseService.createUser({ email, name, tier });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await databaseService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/organizations', async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const organization = await databaseService.createOrganization({ name, slug, description });
    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, slug, description, organizationId } = req.body;
    const project = await databaseService.createProject({ name, slug, description, organizationId });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Storage bucket management
app.post('/api/storage/buckets', async (req, res) => {
  try {
    const bucket = await databaseService.createStorageBucket(req.body);
    res.json({ success: true, bucket });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/storage/buckets/project/:projectId', async (req, res) => {
  try {
    const buckets = await databaseService.getStorageBucketsByProject(req.params.projectId);
    res.json({ success: true, buckets });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Analytics and reporting routes
app.get('/api/analytics/users/:userId/stats', async (req, res) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const stats = await databaseService.getUserUploadStats(req.params.userId, period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/analytics/organizations/:organizationId/stats', async (req, res) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const stats = await databaseService.getOrganizationUploadStats(req.params.organizationId, period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/analytics/projects/:projectId/stats', async (req, res) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const stats = await databaseService.getProjectUploadStats(req.params.projectId, period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Quota management routes
app.get('/api/users/:userId/quotas', async (req, res) => {
  try {
    const user = await databaseService.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, quotas: user.quotas });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/users/:userId/quotas/reset', async (req, res) => {
  try {
    const { type } = req.body;
    const organizationId = req.body.organizationId;
    
    await databaseService.resetUserQuota(req.params.userId, organizationId, type);
    res.json({ success: true, message: 'Quota reset successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Audit logging routes
app.get('/api/audit-logs', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId as string,
      organizationId: req.query.organizationId as string,
      projectId: req.query.projectId as string,
      action: req.query.action as any,
      resourceType: req.query.resourceType as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const logs = await databaseService.getAuditLogs(filters);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Initialize upload with database integration
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

    // Create upload session in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadSession = await databaseService.createUploadSession({
      sessionId,
      organizationId: processedMetadata.organizationId,
      projectId: processedMetadata.projectId,
      userId: processedMetadata.userId,
      routeName,
      metadata: processedMetadata,
    });

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
      uploadSessionId: uploadSession.id,
      storageAllocation: allocation,
      presignedUrl: presignedUrl.url,
    };
    
    await progressMiddleware.initializeUpload(req, res, next);

  } catch (error) {
    next(error);
  }
});

// Upload completion with database integration
app.post('/api/upload/complete', async (req, res, next) => {
  try {
    const { uploadId, routeName, fileKey, fileInfo, storageAllocation, uploadSessionId } = req.body;
    
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

    // Create file record in database
    const fileUpload = await databaseService.createFileUpload({
      key: fileKey,
      fileName: fileInfo?.name || progress.fileName,
      originalName: fileInfo?.originalName || progress.fileName,
      fileSize: BigInt(fileInfo?.size || progress.fileSize),
      mimeType: fileInfo?.type || 'application/octet-stream',
      hash: fileInfo?.hash,
      storageProvider: storageAllocation.provider as any,
      bucketId: storageAllocation.bucketId || 'default',
      organizationId: req.body.metadata.organizationId,
      projectId: req.body.metadata.projectId,
      userId: req.body.metadata.userId,
      uploadSessionId,
      metadata: fileInfo?.metadata,
      tags: fileInfo?.tags || [],
      isPublic: fileInfo?.isPublic || false,
    });

    // Update upload session
    if (uploadSessionId) {
      await databaseService.updateUploadSession(uploadSessionId, {
        completedFiles: { increment: 1 },
        uploadedBytes: { increment: BigInt(fileInfo?.size || progress.fileSize) },
        progress: 100, // Assuming single file upload
      });
    }

    // Create file object with database information
    const file = {
      id: fileUpload.id,
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
    
    // Connect to database
    await databaseService.connect();
    console.log('✅ Database connection established');
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Carcosa Production Database Server running on port ${PORT}`);
      console.log(`📊 Progress tracking: ENABLED`);
      console.log(`🔄 Resumable uploads: ENABLED`);
      console.log(`📦 Chunked uploads: ENABLED (5MB chunks)`);
      console.log(`☁️ Storage providers: ${Array.from(storageManager.getAllProviders().keys()).join(', ')}`);
      console.log(`🗄️ Database integration: ENABLED`);
      console.log(`📈 Analytics & reporting: ENABLED`);
      console.log(`💰 Quota management: ENABLED`);
      console.log(`📋 Audit logging: ENABLED`);
      console.log(`📁 Available routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
      console.log(`📈 Health check: http://localhost:${PORT}/api/storage/health`);
      console.log(`📊 User stats: http://localhost:${PORT}/api/analytics/users/{userId}/stats`);
      console.log(`📊 Organization stats: http://localhost:${PORT}/api/analytics/organizations/{orgId}/stats`);
      console.log(`📊 Project stats: http://localhost:${PORT}/api/analytics/projects/{projectId}/stats`);
      console.log(`📋 Audit logs: http://localhost:${PORT}/api/audit-logs`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;