import { createUploadRouter, f } from '../src';

// Create the upload router for Next.js
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
      // In Next.js, you'd get user info from session/auth
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update user profile with new image
      console.log(`Profile image updated for user ${metadata.userId}`);
      
      // You could:
      // - Update user profile in database
      // - Generate different image sizes
      // - Update avatar URLs
      
      return {
        profileUpdated: true,
        imageUrl: file.url,
        userId: metadata.userId,
      };
    })
);

// Product image uploader for e-commerce
uploadRouter.addRoute(
  'productImages',
  f.imageUploader({ maxFileSize: '8MB', maxFileCount: 10 })
    .middleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Product image uploaded: ${file.name}`);
      
      // Could trigger:
      // - Multiple size generation (thumb, medium, large)
      // - Background removal
      // - Color palette extraction
      // - SEO optimization
      
      return {
        productImage: true,
        fileName: file.name,
        sizes: ['thumb', 'medium', 'large'],
      };
    })
);

// File uploader for general documents
uploadRouter.addRoute(
  'generalFiles',
  f.fileUploader({ maxFileSize: '32MB', maxFileCount: 20 })
    .middleware(async ({ req, metadata }) => {
      const userId = req.headers['x-user-id'] as string;
      const projectId = req.headers['x-project-id'] as string;
      
      if (!userId || !projectId) {
        throw new Error('Authentication required');
      }

      return { userId, projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`File uploaded: ${file.name} (${file.type})`);
      
      return {
        fileUploaded: true,
        fileName: file.name,
        fileType: file.type,
        uploadedBy: metadata.userId,
      };
    })
);

// Export for use in Next.js API routes
export default uploadRouter;