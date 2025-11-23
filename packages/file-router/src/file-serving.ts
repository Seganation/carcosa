import { Request, Response, NextFunction } from 'express';
import { RouteDefinition } from './types.js';

// File serving configuration
export interface FileServingConfig {
  baseUrl: string;
  cdnUrl?: string;
  projectId: string;
  organizationId?: string;
  cacheControl?: string;
  cors?: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  };
}

// File URL generator
export class FileUrlGenerator {
  constructor(private config: FileServingConfig) {}

  // Generate deterministic file URL
  generateFileUrl(fileKey: string, projectId?: string): string {
    const project = projectId || this.config.projectId;
    const base = this.config.cdnUrl || this.config.baseUrl;
    
    // Format: https://files.yourdomain.com/f/{PROJECT_ID}/{FILE_KEY}
    return `${base}/f/${project}/${fileKey}`;
  }

  // Generate transform URL
  generateTransformUrl(
    fileKey: string, 
    transforms: Record<string, any>, 
    projectId?: string
  ): string {
    const project = projectId || this.config.projectId;
    const base = this.config.cdnUrl || this.config.baseUrl;
    
    // Format: https://transforms.yourdomain.com/t/{PROJECT_ID}/{FILE_KEY}?w=300&h=200&q=80
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(transforms)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    }
    
    const queryString = queryParams.toString();
    const url = `${base}/t/${project}/${fileKey}`;
    
    return queryString ? `${url}?${queryString}` : url;
  }

  // Generate signed URL for private files
  generateSignedUrl(
    fileKey: string, 
    expiresIn: number = 3600, // 1 hour default
    projectId?: string
  ): string {
    const project = projectId || this.config.projectId;
    const base = this.config.baseUrl;
    
    // Format: https://api.yourdomain.com/signed/{PROJECT_ID}/{FILE_KEY}?expires={TIMESTAMP}&signature={HMAC}
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const signature = this.generateSignature(fileKey, project, expires);
    
    return `${base}/signed/${project}/${fileKey}?expires=${expires}&signature=${signature}`;
  }

  // Generate signature for signed URLs
  private generateSignature(fileKey: string, projectId: string, expires: number): string {
    // TODO: Implement HMAC signature generation
    // This should use a secret key and HMAC-SHA256
    const payload = `${projectId}:${fileKey}:${expires}`;
    return Buffer.from(payload).toString('base64').replace(/[+/=]/g, '');
  }
}

// File serving middleware
export class FileServingMiddleware {
  constructor(
    private config: FileServingConfig,
    private urlGenerator: FileUrlGenerator
  ) {}

  // Serve public files
  servePublicFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, fileKey } = req.params;
      
      if (!projectId || !fileKey) {
        return res.status(400).json({ error: 'Project ID and file key required' });
      }

      // Set CDN-friendly headers
      res.set({
        'Cache-Control': this.config.cacheControl || 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': this.getCorsOrigin(req),
        'Access-Control-Allow-Methods': this.config.cors?.methods?.join(', ') || 'GET, HEAD',
        'Access-Control-Allow-Headers': this.config.cors?.allowedHeaders?.join(', ') || 'Content-Type',
      });

      // TODO: Implement actual file serving logic
      // This should:
      // 1. Look up file metadata in database
      // 2. Generate presigned GET URL from storage provider
      // 3. Redirect or proxy the file
      
      // For now, return a placeholder
      res.json({
        fileKey,
        projectId,
        url: this.urlGenerator.generateFileUrl(fileKey, projectId),
        status: 'serving',
      });

    } catch (error) {
      next(error);
    }
  }

  // Serve transformed files
  serveTransformedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, fileKey } = req.params;
      const transforms = req.query;
      
      if (!projectId || !fileKey) {
        return res.status(400).json({ error: 'Project ID and file key required' });
      }

      // Set transform-specific headers
      res.set({
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': this.getCorsOrigin(req),
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      // TODO: Implement transform serving logic
      // This should:
      // 1. Check if transform already exists
      // 2. If not, trigger transform pipeline
      // 3. Serve transformed file with caching
      
      res.json({
        fileKey,
        projectId,
        transforms,
        url: this.urlGenerator.generateTransformUrl(fileKey, transforms, projectId),
        status: 'transforming',
      });

    } catch (error) {
      next(error);
    }
  }

  // Serve signed files (private access)
  serveSignedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, fileKey } = req.params;
      const { expires, signature } = req.query;
      
      if (!projectId || !fileKey || !expires || !signature) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify signature
      if (!this.verifySignature(fileKey, projectId, parseInt(expires as string), signature as string)) {
        return res.status(403).json({ error: 'Invalid signature or expired URL' });
      }

      // Set private file headers
      res.set({
        'Cache-Control': 'private, max-age=300',
        'Access-Control-Allow-Origin': this.getCorsOrigin(req),
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      // TODO: Implement private file serving
      res.json({
        fileKey,
        projectId,
        status: 'serving_private',
        expires: parseInt(expires as string),
      });

    } catch (error) {
      next(error);
    }
  }

  // Verify signed URL signature
  private verifySignature(fileKey: string, projectId: string, expires: number, signature: string): boolean {
    // TODO: Implement signature verification
    // This should use the same HMAC logic as signature generation
    const expectedSignature = this.generateSignature(fileKey, projectId, expires);
    return signature === expectedSignature;
  }

  // Generate signature (temporary implementation)
  private generateSignature(fileKey: string, projectId: string, expires: number): string {
    const payload = `${projectId}:${fileKey}:${expires}`;
    return Buffer.from(payload).toString('base64').replace(/[+/=]/g, '');
  }

  // Get CORS origin
  private getCorsOrigin(req: Request): string {
    if (!this.config.cors?.origin) {
      return '*';
    }
    
    if (Array.isArray(this.config.cors.origin)) {
      const origin = req.headers.origin;
      if (origin && this.config.cors.origin.includes(origin)) {
        return origin;
      }
      return this.config.cors.origin[0];
    }
    
    return this.config.cors.origin;
  }
}

// Factory function to create file serving middleware
export function createFileServingMiddleware(config: FileServingConfig): FileServingMiddleware {
  const urlGenerator = new FileUrlGenerator(config);
  return new FileServingMiddleware(config, urlGenerator);
}