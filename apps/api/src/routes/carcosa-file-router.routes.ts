import { Router } from 'express';
import { createUploadRouter, f, createUploadMiddleware } from '@carcosa/file-router';
import { requireAuth } from '../middlewares/auth.js';
import { prisma } from '@carcosa/database';
import { createStorageManager, createS3Adapter, createR2Adapter } from '@carcosa/file-router';
import { createRealtimeSystem } from '@carcosa/file-router';

// Create storage manager with fallback for development
const storageManager = createStorageManager({
  s3: process.env.AWS_ACCESS_KEY_ID ? createS3Adapter({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET!,
  }) : undefined,
  r2: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? createR2Adapter({
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    bucket: process.env.CLOUDFLARE_R2_BUCKET!,
  }) : undefined,
});

// Create real-time system for upload progress
const realtimeSystem = createRealtimeSystem({
  redisUrl: process.env.REDIS_URL,
  corsOrigins: process.env.NODE_ENV === 'production'
    ? [`${process.env.API_URL?.replace('/api/v1', '')}:3000`]
    : ['http://localhost:3000'],
});

// Create the upload router with Carcosa-specific configuration
const uploadRouter = createUploadRouter()
  // Image uploads with validation and optimization
  .addRoute('images', f.imageUploader({
    maxFileSize: '4MB',
    maxFileCount: 10,
    image: {
      width: { min: 100, max: 4096 },
      height: { min: 100, max: 4096 },
      format: ['jpeg', 'png', 'webp', 'gif'],
    },
  }).addMiddleware(async (ctx) => {
    // Add user and project context
    return {
      ...ctx.metadata,
      userId: ctx.req.userId,
      projectId: ctx.params.projectId,
      organizationId: ctx.req.organizationId,
    };
  }).addUploadCompleteHandler(async (ctx) => {
    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        projectId: ctx.metadata.projectId,
        path: ctx.file.key,
        filename: ctx.file.name,
        size: BigInt(ctx.file.size),
        mimeType: ctx.file.type,
        metadata: ctx.metadata,
        uploadedAt: ctx.file.uploadedAt,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: ctx.metadata.projectId,
        userId: ctx.metadata.userId,
        action: 'file_upload',
        resource: 'file',
        details: {
          fileId: file.id,
          fileName: ctx.file.name,
          fileSize: ctx.file.size,
          fileType: ctx.file.type,
        },
      },
    });

    // Send real-time progress update
    realtimeSystem.emit('upload:complete', {
      userId: ctx.metadata.userId,
      projectId: ctx.metadata.projectId,
      file: ctx.file,
      metadata: ctx.metadata,
    });

    return { fileId: file.id, success: true };
  }))

  // Document uploads
  .addRoute('documents', f.documentUploader({
    maxFileSize: '16MB',
    maxFileCount: 5,
  }).addMiddleware(async (ctx) => {
    return {
      ...ctx.metadata,
      userId: ctx.req.userId,
      projectId: ctx.params.projectId,
      organizationId: ctx.req.organizationId,
    };
  }).addUploadCompleteHandler(async (ctx) => {
    const file = await prisma.file.create({
      data: {
        projectId: ctx.metadata.projectId,
        path: ctx.file.key,
        filename: ctx.file.name,
        size: BigInt(ctx.file.size),
        mimeType: ctx.file.type,
        metadata: ctx.metadata,
        uploadedAt: ctx.file.uploadedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        projectId: ctx.metadata.projectId,
        userId: ctx.metadata.userId,
        action: 'document_upload',
        resource: 'file',
        details: {
          fileId: file.id,
          fileName: ctx.file.name,
          fileSize: ctx.file.size,
          fileType: ctx.file.type,
        },
      },
    });

    return { fileId: file.id, success: true };
  }))

  // Video uploads with processing
  .addRoute('videos', f.videoUploader({
    maxFileSize: '128MB',
    maxFileCount: 3,
    video: {
      duration: { max: 3600 }, // 1 hour max
      format: ['mp4', 'mov', 'avi', 'webm'],
    },
  }).addMiddleware(async (ctx) => {
    return {
      ...ctx.metadata,
      userId: ctx.req.userId,
      projectId: ctx.params.projectId,
      organizationId: ctx.req.organizationId,
    };
  }).addUploadCompleteHandler(async (ctx) => {
    const file = await prisma.file.create({
      data: {
        projectId: ctx.metadata.projectId,
        path: ctx.file.key,
        filename: ctx.file.name,
        size: BigInt(ctx.file.size),
        mimeType: ctx.file.type,
        metadata: ctx.metadata,
        uploadedAt: ctx.file.uploadedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        projectId: ctx.metadata.projectId,
        userId: ctx.metadata.userId,
        action: 'video_upload',
        resource: 'file',
        details: {
          fileId: file.id,
          fileName: ctx.file.name,
          fileSize: ctx.file.size,
          fileType: ctx.file.type,
        },
      },
    });

    return { fileId: file.id, success: true };
  }));

// Create upload middleware
const uploadMiddleware = createUploadMiddleware(uploadRouter);

// Create Express router
const router = Router();

// Upload initialization endpoint
router.post('/init', requireAuth, async (req, res) => {
  try {
    await uploadMiddleware.handleUploadInit(req, res, () => {});
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({ error: 'Upload initialization failed' });
  }
});

// Upload completion endpoint
router.post('/complete', requireAuth, async (req, res) => {
  try {
    await uploadMiddleware.handleUploadComplete(req, res, () => {});
  } catch (error) {
    console.error('Upload complete error:', error);
    res.status(500).json({ error: 'Upload completion failed' });
  }
});

// Real-time WebSocket endpoint
router.get('/realtime', (req, res) => {
  // This will be handled by the WebSocket upgrade
  res.status(426).json({ error: 'WebSocket upgrade required' });
});

// File serving endpoint
router.get('/files/*', async (req, res) => {
  try {
    const filePath = req.params[0]; // Get the wildcard part
    // TODO: Implement file serving with authentication
    res.json({ filePath, message: 'File serving not yet implemented' });
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ error: 'File serving failed' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['upload', 'realtime', 'storage'],
  });
});

export default router;
