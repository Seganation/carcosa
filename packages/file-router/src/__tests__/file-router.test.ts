import { createUploadRouter, f, createTransformPipeline, createUrlRouter } from '../index';

describe('Carcosa File Router', () => {
  describe('Upload Router', () => {
    it('should create a router with typed routes', () => {
      const router = createUploadRouter<{ userId: string; projectId: string }>();
      
      router.addRouteFromBuilder(
        'testRoute',
        f.imageUploader({ maxFileSize: '4MB', maxFileCount: 1 })
          .addMiddleware(async ({ req, metadata }) => {
            return { userId: 'user123', projectId: 'proj456' };
          })
          .addUploadCompleteHandler(async ({ metadata, file }) => {
            return { success: true };
          })
      );

      const route = router.getRoute('testRoute');
      expect(route).toBeDefined();
      expect(route?.config.maxFileSize).toBe('4MB');
      expect(route?.config.maxFileCount).toBe(1);
    });

    it('should validate route configuration', () => {
      const router = createUploadRouter();
      expect(() => router.validate()).not.toThrow();
    });

    it('should support multiple file types', () => {
      const router = createUploadRouter();
      
      // Image uploader
      router.addRouteFromBuilder('image', f.imageUploader({ maxFileSize: '4MB' }));
      
      // Video uploader
      router.addRouteFromBuilder('video', f.videoUploader({ maxFileSize: '128MB' }));
      
      // Audio uploader
      router.addRouteFromBuilder('audio', f.audioUploader({ maxFileSize: '32MB' }));
      
      // Document uploader
      router.addRouteFromBuilder('document', f.documentUploader({ maxFileSize: '16MB' }));

      expect(router.getRoutes().size).toBe(4);
    });
  });

  describe('Transform Pipeline', () => {
    it('should create transform jobs', async () => {
      const pipeline = createTransformPipeline({
        maxConcurrentJobs: 3,
        jobTimeout: 60000,
        retryAttempts: 2,
        storage: { provider: 's3', bucket: 'test' },
        cache: { enabled: true, ttl: 3600000, maxSize: 100 },
      });

      const job = await pipeline.createTransformJob(
        'test-file.jpg',
        'test-project',
        ['resize', 'format'],
        {
          resize: { width: 800, height: 600 },
          format: { type: 'webp', quality: 80 },
        }
      );

      expect(job.id).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.operations).toContain('resize');
      expect(job.operations).toContain('format');
    });

    it('should track job progress', async () => {
      const pipeline = createTransformPipeline({
        maxConcurrentJobs: 1,
        jobTimeout: 60000,
        retryAttempts: 1,
        storage: { provider: 's3', bucket: 'test' },
        cache: { enabled: true, ttl: 3600000, maxSize: 100 },
      });

      const job = await pipeline.createTransformJob(
        'test-file.jpg',
        'test-project',
        ['resize'],
        { resize: { width: 800, height: 600 } }
      );

      // Wait for job to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedJob = pipeline.getJobStatus(job.id);
      expect(updatedJob?.status).toBe('completed');
      expect(updatedJob?.progress).toBe(100);
    });
  });

  describe('URL Routing', () => {
    it('should create URL router with configuration', () => {
      const uploadRouter = createUploadRouter();
      const urlRouter = createUrlRouter({
        baseUrl: 'https://files.test.com',
        projectId: 'test-project',
        enablePublicFiles: true,
        enableTransforms: true,
        enableSignedFiles: true,
      }, uploadRouter);

      expect(urlRouter.getRouter()).toBeDefined();
      expect(urlRouter.getFileServing()).toBeDefined();
      expect(urlRouter.getUploadRouter()).toBeDefined();
    });
  });

  describe('File Type Builders', () => {
    it('should build image uploader with constraints', () => {
      const builder = f.imageUploader({
        maxFileSize: '4MB',
        maxFileCount: 5,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      const route = builder.build();
      expect(route.config.image?.maxFileSize).toBe('4MB');
      expect(route.config.image?.maxFileCount).toBe(5);
      expect(route.config.image?.maxWidth).toBe(1920);
      expect(route.config.image?.maxHeight).toBe(1080);
    });

    it('should build video uploader with constraints', () => {
      const builder = f.videoUploader({
        maxFileSize: '128MB',
        maxFileCount: 1,
        maxDuration: 300,
      });

      const route = builder.build();
      expect(route.config.video?.maxFileSize).toBe('128MB');
      expect(route.config.video?.maxFileCount).toBe(1);
      expect(route.config.video?.maxDuration).toBe(300);
    });

    it('should build audio uploader with constraints', () => {
      const builder = f.audioUploader({
        maxFileSize: '32MB',
        maxFileCount: 10,
        maxDuration: 600,
      });

      const route = builder.build();
      expect(route.config.audio?.maxFileSize).toBe('32MB');
      expect(route.config.audio?.maxFileCount).toBe(10);
      expect(route.config.audio?.maxDuration).toBe(600);
    });

    it('should build document uploader with constraints', () => {
      const builder = f.documentUploader({
        maxFileSize: '16MB',
        maxFileCount: 20,
      });

      const route = builder.build();
      expect(route.config.maxFileSize).toBe('16MB');
      expect(route.config.maxFileCount).toBe(20);
    });
  });

  describe('Middleware Integration', () => {
    it('should support custom middleware', () => {
      const router = createUploadRouter<{ userId: string; role: string }>();
      
      router.addRouteFromBuilder(
        'adminUpload',
        f.fileUploader()
          .addMiddleware(async ({ req, metadata }) => {
            // Simulate admin check
            const role = req.headers['x-user-role'] as string;
            if (role !== 'admin') {
              throw new Error('Admin access required');
            }
            return { userId: 'admin123', role: 'admin' };
          })
      );

      const route = router.getRoute('adminUpload');
      expect(route?.middleware).toBeDefined();
    });

    it('should support upload completion handlers', () => {
      const router = createUploadRouter<{ userId: string }>();
      
      router.addRouteFromBuilder(
        'testUpload',
        f.fileUploader()
          .addUploadCompleteHandler(async ({ metadata, file }) => {
            return { processed: true, userId: metadata.userId };
          })
      );

      const route = router.getRoute('testUpload');
      expect(route?.onUploadComplete).toBeDefined();
    });
  });
});