import express from 'express';
import { createUploadRouter, createUploadMiddleware, f } from '../src';

// Create the upload router with typed routes
export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
  organizationId?: string;
}>();

// Define your upload routes
uploadRouter.addRoute(
  'imageUploader',
  f.imageUploader({ maxFileSize: '4MB', maxFileCount: 1 })
    .middleware(async ({ req, metadata }) => {
      // Custom auth logic - verify user has access to project
      const userId = req.headers['x-user-id'];
      const projectId = req.headers['x-project-id'];
      
      if (!userId || !projectId) {
        throw new Error('User ID and Project ID required');
      }

      // You could add database validation here
      // const hasAccess = await checkUserProjectAccess(userId, projectId);
      // if (!hasAccess) throw new Error('Access denied');

      return {
        userId,
        projectId,
        organizationId: req.headers['x-organization-id'],
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Post-upload processing
      console.log(`Upload complete for user ${metadata.userId} in project ${metadata.projectId}`);
      
      // You could:
      // - Save file metadata to database
      // - Trigger image processing
      // - Send notifications
      // - Update usage metrics
      
      return {
        uploadedBy: metadata.userId,
        projectId: metadata.projectId,
        fileKey: file.key,
        processedAt: new Date(),
      };
    })
);

// Video uploader with size and duration limits
uploadRouter.addRoute(
  'videoUploader',
  f.videoUploader({ maxFileSize: '128MB', maxFileCount: 1, maxDuration: 300 })
    .middleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'];
      const projectId = req.headers['x-project-id'];
      
      if (!userId || !projectId) {
        throw new Error('User ID and Project ID required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Video uploaded: ${file.name} by user ${metadata.userId}`);
      
      // Could trigger video processing pipeline here
      return { status: 'processing', fileKey: file.key };
    })
);

// Document uploader for PDFs and other files
uploadRouter.addRoute(
  'documentUploader',
  f.documentUploader({ maxFileSize: '16MB', maxFileCount: 5 })
    .middleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'];
      const projectId = req.headers['x-project-id'];
      
      if (!userId || !projectId) {
        throw new Error('User ID and Project ID required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Document uploaded: ${file.name}`);
      return { documentType: file.type, uploadedBy: metadata.userId };
    })
);

// Express app setup
const app = express();
app.use(express.json());

// Create middleware instance
const uploadMiddleware = createUploadMiddleware(uploadRouter);

// Upload routes
app.post('/api/upload/init', uploadMiddleware.handleUploadInit.bind(uploadMiddleware));
app.post('/api/upload/complete', uploadMiddleware.handleUploadComplete.bind(uploadMiddleware));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', routes: Array.from(uploadRouter.getRoutes().keys()) });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Carcosa File Router running on port ${PORT}`);
  console.log(`📁 Available routes: ${Array.from(uploadRouter.getRoutes().keys()).join(', ')}`);
});

export default app;