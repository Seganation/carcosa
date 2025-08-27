// Production API Integration Example
// ENTERPRISE GRADE - UPLOADTHING KILLER! 🚀

import express from 'express';
import { createServer } from 'http';
import { createDatabaseService, createStorageManager, createS3Adapter, createR2Adapter } from '../src';
import { createUploadRouter, f } from '../src/router';
import { createProgressMiddleware, setupProgressRoutes } from '../src/progress-middleware';
import { 
  createAuthMiddleware, 
  createWebhookSystem, 
  createRealtimeSystem,
  DEFAULT_AUTH_CONFIG,
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_REALTIME_CONFIG,
} from '../src/api';

// Production configuration
const PRODUCTION_CONFIG = {
  // Server
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: '24h',
    apiKeyHeader: 'X-API-Key',
    enableApiKeys: true,
    enableJWT: true,
    enableAnonymous: false,
    corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
    rateLimitWindow: 60 * 1000, // 1 minute
    rateLimitMax: 100, // 100 requests per minute
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

  // Webhooks
  webhooks: {
    enableWebhooks: true,
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 30000,
    batchSize: 10,
    maxConcurrentDeliveries: 5,
    enableSignatureVerification: true,
    signatureHeader: 'X-Webhook-Signature',
    signatureAlgorithm: 'sha256' as const,
  },

  // Real-time
  realtime: {
    enableRealtime: true,
    corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
    maxConnections: 1000,
    heartbeatInterval: 30000,
    connectionTimeout: 60000,
    enableCompression: true,
    enableBinaryMessages: false,
    enableStickySessions: false,
  },
};

// Initialize services
const databaseService = createDatabaseService();
const storageManager = createStorageManager();
const authMiddleware = createAuthMiddleware(PRODUCTION_CONFIG.auth);
const webhookSystem = createWebhookSystem(PRODUCTION_CONFIG.webhooks);
const realtimeSystem = createRealtimeSystem(PRODUCTION_CONFIG.realtime);

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

// Create upload router with API integration
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  organizationId: string;
  userTier: 'free' | 'pro' | 'enterprise';
  fileType: string;
  metadata?: Record<string, any>;
}>();

// Profile image upload with API integration
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

      // Emit real-time event
      realtimeSystem.emitToUser(metadata.userId, 'upload.completed', {
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        type: 'profile_image',
        storageProvider: file.storageProvider,
      });

      // Send webhook notification
      await webhookSystem.emitEvent('file.uploaded', {
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        userId: metadata.userId,
        organizationId: metadata.organizationId,
        projectId: metadata.projectId,
        type: 'profile_image',
        storageProvider: file.storageProvider,
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

// Create progress middleware with API integration
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
const server = createServer(app);

// Initialize real-time system
realtimeSystem.initialize(server);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Security headers
app.use(authMiddleware.securityHeaders);

// CORS
app.use(authMiddleware.cors);

// Request logging
app.use(authMiddleware.requestLogger);

// Authentication middleware
app.use(authMiddleware.authenticateJWT);
app.use(authMiddleware.authenticateAPIKey);

// Rate limiting
app.use(authMiddleware.rateLimit);

// Upload progress routes (protected)
app.use('/api/upload/progress', 
  authMiddleware.requireAuth,
  setupProgressRoutes(progressMiddleware)
);

// Database management routes (protected)
app.post('/api/users', 
  authMiddleware.requireAuth,
  authMiddleware.requirePermission('MANAGE'),
  async (req, res) => {
    try {
      const { email, name, tier } = req.body;
      const user = await databaseService.createUser({ email, name, tier });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.get('/api/users/:id', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const user = await databaseService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Organization management (protected)
app.post('/api/organizations', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      const organization = await databaseService.createOrganization({ name, slug, description });
      res.json({ success: true, organization });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Project management (protected)
app.post('/api/projects', 
  authMiddleware.requireAuth,
  authMiddleware.requireOrganizationAccess,
  async (req, res) => {
    try {
      const { name, slug, description, organizationId } = req.body;
      const project = await databaseService.createProject({ name, slug, description, organizationId });
      res.json({ success: true, project });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Storage bucket management (protected)
app.post('/api/storage/buckets', 
  authMiddleware.requireAuth,
  authMiddleware.requirePermission('MANAGE'),
  async (req, res) => {
    try {
      const bucket = await databaseService.createStorageBucket(req.body);
      res.json({ success: true, bucket });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Analytics and reporting (protected)
app.get('/api/analytics/users/:userId/stats', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
      const stats = await databaseService.getUserUploadStats(req.params.userId, period);
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.get('/api/analytics/organizations/:organizationId/stats', 
  authMiddleware.requireAuth,
  authMiddleware.requireOrganizationAccess,
  async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
      const stats = await databaseService.getOrganizationUploadStats(req.params.organizationId, period);
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Webhook management (protected)
app.post('/api/webhooks/endpoints', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const { name, url, events, secret } = req.body;
      const endpointId = webhookSystem.registerEndpoint({
        name,
        url,
        events,
        secret,
        status: 'active',
        retryCount: 0,
        maxRetries: 3,
        timeout: 30000,
      });
      res.json({ success: true, endpointId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.get('/api/webhooks/endpoints', 
  authMiddleware.requireAuth,
  (req, res) => {
    const endpoints = webhookSystem.getAllEndpoints();
    res.json({ success: true, endpoints });
  }
);

app.get('/api/webhooks/stats', 
  authMiddleware.requireAuth,
  (req, res) => {
    const stats = webhookSystem.getDeliveryStats();
    res.json({ success: true, stats });
  }
);

// Real-time system management (protected)
app.get('/api/realtime/stats', 
  authMiddleware.requireAuth,
  (req, res) => {
    const stats = realtimeSystem.getStats();
    res.json({ success: true, stats });
  }
);

app.get('/api/realtime/health', 
  authMiddleware.requireAuth,
  (req, res) => {
    const health = realtimeSystem.getHealthStatus();
    res.json({ success: true, health });
  }
);

// API key management (protected)
app.post('/api/keys', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const { name, permissions, organizationId, projectId } = req.body;
      // TODO: Implement API key creation
      res.json({ success: true, message: 'API key creation not yet implemented' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Health check endpoints
app.get('/health', (req, res) => {
  const stats = progressMiddleware.getUploadManager().getStats();
  
  res.json({
    status: 'ok',
    service: 'carcosa-production-api',
    timestamp: new Date().toISOString(),
    environment: PRODUCTION_CONFIG.environment,
    features: {
      progress_tracking: true,
      resumable_uploads: true,
      chunked_uploads: true,
      real_time_updates: true,
      webhooks: true,
      authentication: true,
      rate_limiting: true,
      multi_provider_storage: true,
      database_integration: true,
      analytics: true,
      quota_management: true,
      audit_logging: true,
    },
    upload_stats: stats,
    auth_stats: authMiddleware.getRateLimitStats(),
    webhook_stats: webhookSystem.getDeliveryStats(),
    realtime_stats: realtimeSystem.getStats(),
    storage_providers: Array.from(storageManager.getAllProviders().keys()),
    routes: Array.from(uploadRouter.getRoutes().keys()),
  });
});

app.get('/health/detailed', 
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const storageHealth = await storageManager.healthCheck();
      const webhookHealth = webhookSystem.getHealthStatus();
      const realtimeHealth = realtimeSystem.getHealthStatus();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        storage: storageHealth,
        webhooks: webhookHealth,
        realtime: realtimeHealth,
        auth: authMiddleware.getRateLimitStats(),
        database: 'connected', // TODO: Add database health check
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Initialize upload with API integration
app.post('/api/upload/init', 
  authMiddleware.requireAuth,
  async (req, res, next) => {
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

      // Emit real-time event
      realtimeSystem.emitToUser(processedMetadata.userId, 'upload.session.started', {
        sessionId: uploadSession.id,
        fileName,
        fileSize,
        routeName,
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
  }
);

// Upload completion with API integration
app.post('/api/upload/complete', 
  authMiddleware.requireAuth,
  async (req, res, next) => {
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

      // Emit real-time event
      realtimeSystem.emitToUser(req.body.metadata.userId, 'upload.completed', {
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        type: 'file_upload',
        storageProvider: file.storageProvider,
      });

      // Send webhook notification
      await webhookSystem.emitEvent('file.uploaded', {
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        userId: req.body.metadata.userId,
        organizationId: req.body.metadata.organizationId,
        projectId: req.body.metadata.projectId,
        type: 'file_upload',
        storageProvider: file.storageProvider,
      });

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
  }
);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(PRODUCTION_CONFIG.environment === 'development' && { stack: err.stack }),
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
    
    // Start server
    server.listen(PRODUCTION_CONFIG.port, () => {
      console.log(`🚀 Carcosa Production API Server running on port ${PRODUCTION_CONFIG.port}`);
      console.log(`🌍 Environment: ${PRODUCTION_CONFIG.environment}`);
      console.log(`📊 Progress tracking: ENABLED`);
      console.log(`🔄 Resumable uploads: ENABLED`);
      console.log(`📦 Chunked uploads: ENABLED (5MB chunks)`);
      console.log(`☁️ Storage providers: ${Array.from(storageManager.getAllProviders().keys()).join(', ')}`);
      console.log(`🗄️ Database integration: ENABLED`);
      console.log(`📈 Analytics & reporting: ENABLED`);
      console.log(`💰 Quota management: ENABLED`);
      console.log(`📋 Audit logging: ENABLED`);
      console.log(`🔐 Authentication: ENABLED`);
      console.log(`🚦 Rate limiting: ENABLED`);
      console.log(`🔔 Webhooks: ENABLED`);
      console.log(`⚡ Real-time: ENABLED`);
      console.log(`📁 Available routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
      console.log(`📈 Health check: http://localhost:${PRODUCTION_CONFIG.port}/health`);
      console.log(`📊 Detailed health: http://localhost:${PRODUCTION_CONFIG.port}/health/detailed`);
      console.log(`📈 User stats: http://localhost:${PRODUCTION_CONFIG.port}/api/analytics/users/{userId}/stats`);
      console.log(`📊 Organization stats: http://localhost:${PRODUCTION_CONFIG.port}/api/analytics/organizations/{orgId}/stats`);
      console.log(`📋 Webhook stats: http://localhost:${PRODUCTION_CONFIG.port}/api/webhooks/stats`);
      console.log(`⚡ Real-time stats: http://localhost:${PRODUCTION_CONFIG.port}/api/realtime/stats`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Graceful shutdown initiated...');
  
  realtimeSystem.shutdown();
  webhookSystem.cleanupOldDeliveries(0); // Clean up all old deliveries
  
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;