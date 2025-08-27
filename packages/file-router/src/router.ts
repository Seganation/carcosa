import { z } from 'zod';
import { RouteConfig, RouteDefinition, MiddlewareContext, UploadCompleteContext, File, UploadMetadata } from './types';

// Re-export types for use in other modules
export type { RouteDefinition, MiddlewareContext, UploadCompleteContext } from './types';

// File type builder with validation
export class FileTypeBuilder<T extends UploadMetadata = UploadMetadata> {
  public config: RouteConfig = {};
  public middleware?: (ctx: MiddlewareContext<T>) => Promise<T> | T;
  public onUploadComplete?: (ctx: UploadCompleteContext<T>) => Promise<any> | any;

  constructor(private fileType: string) {}

  // Set file size constraints
  maxFileSize(size: string): this {
    this.config.maxFileSize = size as any;
    return this;
  }

  // Set file count constraints
  maxFileCount(count: number): this {
    this.config.maxFileCount = count;
    return this;
  }

  // Set image-specific constraints
  image(config: RouteConfig['image']): this {
    this.config.image = config;
    return this;
  }

  // Set video-specific constraints
  video(config: RouteConfig['video']): this {
    this.config.video = config;
    return this;
  }

  // Set audio-specific constraints
  audio(config: RouteConfig['audio']): this {
    this.config.audio = config;
    return this;
  }

  // Add middleware for custom validation/auth
  addMiddleware(fn: (ctx: MiddlewareContext<T>) => Promise<T> | T): this {
    this.middleware = fn;
    return this;
  }

  // Handle upload completion
  addUploadCompleteHandler(fn: (ctx: UploadCompleteContext<T>) => Promise<any> | any): this {
    this.onUploadComplete = fn;
    return this;
  }

  // Build the route definition
  build(): RouteDefinition<T> {
    return {
      config: this.config,
      middleware: this.middleware,
      onUploadComplete: this.onUploadComplete,
    };
  }
}

// Main router builder class
export class UploadRouter<T extends UploadMetadata = UploadMetadata> {
  private routes: Map<string, RouteDefinition<T>> = new Map();

  // Create a file uploader with constraints
  fileUploader(config: RouteConfig = {}): FileTypeBuilder<T> {
    return new FileTypeBuilder<T>('file').maxFileSize('4MB');
  }

  // Create an image uploader
  imageUploader(config: RouteConfig['image'] = {}): FileTypeBuilder<T> {
    return new FileTypeBuilder<T>('image')
      .maxFileSize('4MB')
      .image(config);
  }

  // Create a video uploader
  videoUploader(config: RouteConfig['video'] = {}): FileTypeBuilder<T> {
    return new FileTypeBuilder<T>('video')
      .maxFileSize('128MB')
      .video(config);
  }

  // Create an audio uploader
  audioUploader(config: RouteConfig['audio'] = {}): FileTypeBuilder<T> {
    return new FileTypeBuilder<T>('audio')
      .maxFileSize('32MB')
      .audio(config);
  }

  // Create a document uploader
  documentUploader(config: RouteConfig = {}): FileTypeBuilder<T> {
    return new FileTypeBuilder<T>('document').maxFileSize('16MB');
  }

  // Add a custom route
  addRoute(name: string, route: RouteDefinition<T>): this {
    this.routes.set(name, route);
    return this;
  }

  // Add a route from a builder
  addRouteFromBuilder(name: string, builder: FileTypeBuilder<T>): this {
    this.routes.set(name, builder.build());
    return this;
  }

  // Get all routes
  getRoutes(): Map<string, RouteDefinition<T>> {
    return this.routes;
  }

  // Get a specific route
  getRoute(name: string): RouteDefinition<T> | undefined {
    return this.routes.get(name);
  }

  // Validate route configuration
  validate(): boolean {
    for (const [name, route] of Array.from(this.routes.entries())) {
      if (!route.config) {
        throw new Error(`Route ${name} is missing configuration`);
      }
    }
    return true;
  }
}

// Factory function to create a new router
export function createUploadRouter<T extends UploadMetadata = UploadMetadata>(): UploadRouter<T> {
  return new UploadRouter<T>();
}

// Utility function to create file type builders
export const f = {
  fileUploader: <T extends UploadMetadata = UploadMetadata>(config?: RouteConfig) => new FileTypeBuilder<T>('file').maxFileSize('4MB'),
  imageUploader: <T extends UploadMetadata = UploadMetadata>(config?: RouteConfig['image']) => new FileTypeBuilder<T>('image').maxFileSize('4MB').image(config),
  videoUploader: <T extends UploadMetadata = UploadMetadata>(config?: RouteConfig['video']) => new FileTypeBuilder<T>('video').maxFileSize('128MB').video(config),
  audioUploader: <T extends UploadMetadata = UploadMetadata>(config?: RouteConfig['audio']) => new FileTypeBuilder<T>('audio').maxFileSize('32MB').audio(config),
  documentUploader: <T extends UploadMetadata = UploadMetadata>(config?: RouteConfig) => new FileTypeBuilder<T>('document').maxFileSize('16MB'),
};