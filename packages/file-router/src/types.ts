import { z } from 'zod';

// File type definitions
export const FileSchema = z.object({
  key: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string().optional(),
  uploadedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type File = z.infer<typeof FileSchema>;

// Upload metadata schema
export const UploadMetadataSchema = z.record(z.any());
export type UploadMetadata = z.infer<typeof UploadMetadataSchema>;

// File size constraints
export const FileSizeSchema = z.enum(['1B', '1KB', '1MB', '4MB', '8MB', '16MB', '32MB', '64MB', '128MB', '256MB', '512MB', '1GB', '2GB', '4GB', '8GB', '16GB']);
export type FileSize = z.infer<typeof FileSizeSchema>;

// File type constraints
export const FileTypeSchema = z.enum(['image', 'video', 'audio', 'text', 'pdf', 'spreadsheet', 'presentation', 'archive', 'code', 'font', 'model', 'other']);
export type FileType = z.infer<typeof FileTypeSchema>;

// Route configuration
export interface RouteConfig {
  maxFileSize?: FileSize;
  maxFileCount?: number;
  allowedFileTypes?: FileType[];
  image?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  video?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxDuration?: number;
  };
  audio?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxDuration?: number;
  };
}

// Middleware context
export interface MiddlewareContext<T = any> {
  req: any; // Express request
  res: any; // Express response
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  metadata?: T;
}

// Upload completion context
export interface UploadCompleteContext<T = any> {
  metadata: T;
  file: File;
  userId?: string;
  projectId?: string;
  organizationId?: string;
}

// Route definition
export interface RouteDefinition<T = any> {
  config: RouteConfig;
  middleware?: (ctx: MiddlewareContext<T>) => Promise<T> | T;
  onUploadComplete?: (ctx: UploadCompleteContext<T>) => Promise<any> | any;
}

// Router configuration
export interface RouterConfig {
  projectId: string;
  organizationId?: string;
  baseUrl?: string;
  apiKey?: string;
}