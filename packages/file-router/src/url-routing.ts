import { Router, Request, Response, NextFunction } from 'express';
import { FileServingMiddleware, FileServingConfig, FileUrlGenerator } from './file-serving.js';
import { UploadRouter } from './router.js';

// URL routing configuration
export interface UrlRoutingConfig extends FileServingConfig {
  baseUrl: string;
  projectId: string;
  enablePublicFiles?: boolean;
  enableTransforms?: boolean;
  enableSignedFiles?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
    message?: string;
  };
}

// URL router class
export class CarcosaUrlRouter {
  private router: Router;
  private fileServing: FileServingMiddleware;
  private uploadRouter: UploadRouter;

  constructor(
    private config: UrlRoutingConfig,
    uploadRouter: UploadRouter
  ) {
    this.router = Router();
    // Create a FileUrlGenerator instance
    const urlGenerator = new FileUrlGenerator(config);
    this.fileServing = new FileServingMiddleware(config, urlGenerator);
    this.uploadRouter = uploadRouter;
    this.setupRoutes();
  }

  // Setup all URL routes
  private setupRoutes() {
    // Public file serving
    if (this.config.enablePublicFiles !== false) {
      this.router.get('/f/:projectId/:fileKey(*)', 
        this.rateLimitMiddleware(),
        this.fileServing.servePublicFile.bind(this.fileServing)
      );
    }

    // Transform serving
    if (this.config.enableTransforms !== false) {
      this.router.get('/t/:projectId/:fileKey(*)', 
        this.rateLimitMiddleware(),
        this.fileServing.serveTransformedFile.bind(this.fileServing)
      );
    }

    // Signed file serving
    if (this.config.enableSignedFiles !== false) {
      this.router.get('/signed/:projectId/:fileKey(*)', 
        this.rateLimitMiddleware(),
        this.fileServing.serveSignedFile.bind(this.fileServing)
      );
    }

    // Health check
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'carcosa-file-serving',
        timestamp: new Date().toISOString(),
        config: {
          baseUrl: this.config.baseUrl,
          projectId: this.config.projectId,
          features: {
            publicFiles: this.config.enablePublicFiles !== false,
            transforms: this.config.enableTransforms !== false,
            signedFiles: this.config.enableSignedFiles !== false,
          }
        }
      });
    });

    // File info endpoint
    this.router.get('/info/:projectId/:fileKey(*)', 
      this.rateLimitMiddleware(),
      this.getFileInfo.bind(this)
    );

    // Transform status endpoint
    this.router.get('/transform-status/:projectId/:fileKey(*)', 
      this.rateLimitMiddleware(),
      this.getTransformStatus.bind(this)
    );
  }

  // Get file information
  private async getFileInfo(req: Request, res: Response) {
    try {
      const { projectId, fileKey } = req.params;
      
      if (!projectId || !fileKey) {
        return res.status(400).json({ error: 'Project ID and file key required' });
      }

      // TODO: Implement file info lookup
      // This should query the database for file metadata
      
      res.json({
        fileKey,
        projectId,
        info: {
          name: 'example.jpg',
          size: 1024000,
          type: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          metadata: {},
          transforms: ['thumb', 'medium', 'large'],
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to get file info' });
    }
  }

  // Get transform status
  private async getTransformStatus(req: Request, res: Response) {
    try {
      const { projectId, fileKey } = req.params;
      const { transform } = req.query;
      
      if (!projectId || !fileKey) {
        return res.status(400).json({ error: 'Project ID and file key required' });
      }

      // TODO: Implement transform status lookup
      // This should check the transform pipeline status
      
      res.json({
        fileKey,
        projectId,
        transform: transform || 'all',
        status: 'completed',
        progress: 100,
        result: {
          url: `/t/${projectId}/${fileKey}?w=300&h=200`,
          size: 512000,
          format: 'webp',
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to get transform status' });
    }
  }

  // Rate limiting middleware
  private rateLimitMiddleware() {
    if (!this.config.rateLimit) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    const { windowMs, max, message } = this.config.rateLimit;
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const userRequests = requests.get(key);

      if (!userRequests || now > userRequests.resetTime) {
        requests.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (userRequests.count >= max) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: message || 'Too many requests',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        });
      }

      userRequests.count++;
      next();
    };
  }

  // Get the Express router
  getRouter(): Router {
    return this.router;
  }

  // Get file serving middleware
  getFileServing(): FileServingMiddleware {
    return this.fileServing;
  }

  // Get upload router
  getUploadRouter(): UploadRouter {
    return this.uploadRouter;
  }
}

// Factory function to create URL router
export function createUrlRouter(
  config: UrlRoutingConfig,
  uploadRouter: UploadRouter
): CarcosaUrlRouter {
  return new CarcosaUrlRouter(config, uploadRouter);
}