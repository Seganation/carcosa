import express from 'express';
import { 
  createUploadRouter, 
  createFileServingMiddleware,
  createUrlRouter,
  createTransformPipeline,
  createTransformMiddleware,
  f 
} from '../src';

// Create the upload router
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  organizationId?: string;
}>();

// Define upload routes
uploadRouter.addRoute(
  'profileImage',
  f.imageUploader({ maxFileSize: '2MB', maxFileCount: 1 })
    .middleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Profile image uploaded: ${file.name}`);
      return { success: true };
    })
);

// Create transform pipeline
const transformPipeline = createTransformPipeline({
  maxConcurrentJobs: 5,
  jobTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  storage: {
    provider: 's3',
    bucket: 'carcosa-transforms',
    region: 'us-east-1',
  },
  cache: {
    enabled: true,
    ttl: 86400000, // 24 hours
    maxSize: 1000,
  },
});

// Create file serving configuration
const fileServingConfig = {
  baseUrl: 'https://files.yourdomain.com',
  cdnUrl: 'https://cdn.yourdomain.com',
  projectId: 'default',
  organizationId: 'org123',
  cacheControl: 'public, max-age=31536000, immutable',
  cors: {
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    methods: ['GET', 'HEAD'],
    allowedHeaders: ['Content-Type'],
  },
  enablePublicFiles: true,
  enableTransforms: true,
  enableSignedFiles: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
  },
};

// Create URL router
const urlRouter = createUrlRouter(fileServingConfig, uploadRouter);

// Create transform middleware
const transformMiddleware = createTransformMiddleware(transformPipeline);

// Express app setup
const app = express();
app.use(express.json());

// File serving routes
app.use('/files', urlRouter.getRouter());

// Transform routes
app.get('/transform/:projectId/:fileKey(*)', transformMiddleware.handleTransform.bind(transformMiddleware));

// Upload routes
app.post('/api/upload/init', (req, res, next) => {
  // Handle upload initialization
  res.json({ message: 'Upload init endpoint' });
});

app.post('/api/upload/complete', (req, res, next) => {
  // Handle upload completion
  res.json({ message: 'Upload complete endpoint' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'carcosa-complete-file-serving',
    timestamp: new Date().toISOString(),
    features: {
      uploadRouter: true,
      fileServing: true,
      transforms: true,
      urlRouting: true,
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Carcosa Complete File Serving running on port ${PORT}`);
  console.log(`📁 File serving: ${fileServingConfig.baseUrl}`);
  console.log(`🔄 Transform pipeline: ${transformPipeline.getJobStatus.length} jobs`);
  console.log(`📤 Upload routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
});

export default app;