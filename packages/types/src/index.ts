export type ProviderType = "r2" | "s3";

export interface Project {
  id: string;
  name: string;
  slug: string;
  provider: ProviderType;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCredentials {
  projectId: string;
  type: ProviderType;
  bucketName: string;
  region?: string;
  endpoint?: string;
  encryptedAccessKey: string;
  encryptedSecretKey: string;
  createdAt: string;
}

export interface FileObject {
  id: string;
  projectId: string;
  tenantId?: string | null;
  path: string;
  version: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "webp" | "jpeg" | "png" | "avif";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface StorageAdapterOptions {
  bucketName: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface SignedPutUrl {
  url: string;
  method: "PUT";
  headers?: Record<string, string>;
  expiresAt: number; // epoch ms
}

export interface StorageAdapter {
  getSignedPutUrl: (
    path: string,
    options?: { contentType?: string; expiresInSeconds?: number; metadata?: Record<string, string> }
  ) => Promise<SignedPutUrl>;
  putObject: (
    path: string,
    body: Buffer | Uint8Array | string | ReadableStream | NodeJS.ReadableStream,
    metadata?: Record<string, string>,
    contentType?: string
  ) => Promise<void>;
  getObject: (
    path: string
  ) => Promise<{ body: NodeJS.ReadableStream; contentType?: string; contentLength?: number; metadata?: Record<string, string> }>;
  listObjects: (prefix: string) => Promise<{ keys: string[] }>;
  deleteObject: (path: string) => Promise<void>;
}

export interface InitUploadRequest {
  projectId: string;
  fileName: string;
  tenantId?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface InitUploadResponse {
  uploadUrl: SignedPutUrl;
  path: string;
  uploadId: string;
}

export interface CompleteUploadRequest {
  uploadId: string;
  metadata?: Record<string, unknown>;
}

export interface ListFilesRequest {
  projectId: string;
  tenantId?: string;
}

export interface MigrateVersionRequest {
  projectId: string;
  fromVersion: string;
  toVersion: string;
}

