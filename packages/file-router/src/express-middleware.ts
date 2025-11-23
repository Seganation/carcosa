import { Request, Response, NextFunction } from 'express';
import { UploadRouter, RouteDefinition, MiddlewareContext, UploadCompleteContext } from './router.js';
import { File, UploadMetadata } from './types.js';

// Multer file interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: { 
        id: string;
        email?: string;
        tier?: 'free' | 'pro' | 'enterprise';
        organizationId?: string;
        projectId?: string;
        permissions?: string[];
      };
      project?: { id: string };
      organization?: { id: string };
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] } | MulterFile;
    }
  }
}

// Express middleware for handling file uploads
export class CarcosaUploadMiddleware {
  constructor(private router: UploadRouter) {}

  // Middleware to handle upload initialization
  async handleUploadInit(req: Request, res: Response, next: NextFunction) {
    try {
      const { routeName, metadata } = req.body;
      
      if (!routeName) {
        return res.status(400).json({ error: 'Route name is required' });
      }

      const route = this.router.getRoute(routeName);
      if (!route) {
        return res.status(404).json({ error: `Route ${routeName} not found` });
      }

      // Run middleware if defined
      let processedMetadata: UploadMetadata = metadata || {};
      if (route.middleware) {
        const ctx: MiddlewareContext = {
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
          return res.status(401).json({ error: 'Middleware validation failed', details: (error as Error).message });
        }
      }

      // Validate file constraints
      const validationResult = this.validateUploadRequest(req, route);
      if (!validationResult.valid) {
        return res.status(400).json({ error: 'File validation failed', details: validationResult.errors });
      }

      // Generate presigned URL for direct upload
      const uploadUrl = await this.generateUploadUrl(routeName, processedMetadata);
      
      res.json({
        uploadUrl,
        metadata: processedMetadata,
        route: routeName,
        constraints: route.config,
      });

    } catch (error) {
      next(error);
    }
  }

  // Middleware to handle upload completion
  async handleUploadComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { routeName, fileKey, metadata, fileInfo } = req.body;
      
      if (!routeName || !fileKey) {
        return res.status(400).json({ error: 'Route name and file key are required' });
      }

      const route = this.router.getRoute(routeName);
      if (!route) {
        return res.status(404).json({ error: `Route ${routeName} not found` });
      }

      // Create file object
      const file: File = {
        key: fileKey,
        name: fileInfo?.name || 'unknown',
        size: fileInfo?.size || 0,
        type: fileInfo?.type || 'application/octet-stream',
        uploadedAt: new Date(),
        metadata: fileInfo?.metadata,
      };

      // Run upload completion handler if defined
      if (route.onUploadComplete) {
        const ctx: UploadCompleteContext = {
          metadata: metadata || {},
          file,
          userId: req.user?.id,
          projectId: req.project?.id,
          organizationId: req.organization?.id,
        };

        try {
          const result = await route.onUploadComplete(ctx);
          res.json({ success: true, file, result });
        } catch (error) {
          res.status(500).json({ error: 'Upload completion handler failed', details: (error as Error).message });
        }
      } else {
        res.json({ success: true, file });
      }

    } catch (error) {
      next(error);
    }
  }

  // Validate upload request against route constraints
  private validateUploadRequest(req: Request, route: RouteDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file count
    if (route.config.maxFileCount && req.files && Array.isArray(req.files)) {
      if (req.files.length > route.config.maxFileCount) {
        errors.push(`Maximum ${route.config.maxFileCount} files allowed`);
      }
    }

    // Check file size
    if (route.config.maxFileSize) {
      const maxSize = this.parseFileSize(route.config.maxFileSize);
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.size > maxSize) {
            errors.push(`File ${file.originalname} exceeds maximum size of ${route.config.maxFileSize}`);
          }
        }
      }
    }

    // Check file types
    if (route.config.allowedFileTypes && req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const fileType = this.getFileType(file.mimetype);
        if (route.config.allowedFileTypes && !route.config.allowedFileTypes.includes(fileType)) {
          errors.push(`File type ${fileType} not allowed for ${file.originalname}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Parse file size string to bytes
  private parseFileSize(size: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    const match = size.match(/^(\d+)([A-Z]+)$/);
    if (!match) {
      throw new Error(`Invalid file size format: ${size}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 1);
  }

  // Get file type from MIME type
  private getFileType(mimeType: string): 'code' | 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'spreadsheet' | 'presentation' | 'archive' | 'font' | 'model' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python')) return 'code';
    if (mimeType.includes('font') || mimeType.includes('woff') || mimeType.includes('ttf')) return 'font';
    if (mimeType.includes('model') || mimeType.includes('3d')) return 'model';
    return 'other';
  }

  // Generate presigned upload URL (placeholder - integrate with storage service)
  private async generateUploadUrl(routeName: string, metadata: UploadMetadata): Promise<string> {
    // TODO: Integrate with Carcosa storage service
    // This should generate a presigned URL for direct upload to S3/R2
    return `https://api.carcosa.com/upload/${routeName}?token=${Date.now()}`;
  }
}

// Factory function to create middleware
export function createUploadMiddleware(router: UploadRouter): CarcosaUploadMiddleware {
  return new CarcosaUploadMiddleware(router);
}