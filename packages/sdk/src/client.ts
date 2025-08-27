import type {
  InitUploadRequest,
  InitUploadResponse,
  CompleteUploadRequest,
  ListFilesRequest,
  MigrateVersionRequest,
  TransformOptions,
} from "@carcosa/types";

export interface CarcosaClientOptions {
  baseUrl: string;
  apiKey: string; // API key is now required
}

export class CarcosaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: CarcosaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    
    if (!this.apiKey) {
      throw new Error("API key is required for CarcosaClient");
    }
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
    };
  }

  /**
   * Initialize a file upload
   * @param payload Upload initialization data
   * @returns Upload response with signed URL
   */
  async initUpload(payload: InitUploadRequest): Promise<InitUploadResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/uploads/init`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`initUpload failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
    
    return (await res.json()) as InitUploadResponse;
  }

  /**
   * Complete an upload after file has been uploaded to storage
   * @param payload Upload completion data
   */
  async completeUpload(payload: CompleteUploadRequest): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/uploads/confirm`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`completeUpload failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
  }

  /**
   * Delete a file from storage
   * @param projectId Project ID
   * @param path File path to delete
   */
  async deleteFile(projectId: string, path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(projectId)}/files`, {
      method: "DELETE",
      headers: this.headers(),
      body: JSON.stringify({ paths: [path] }),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`deleteFile failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
  }

  /**
   * List files in a project
   * @param payload List files request data
   * @returns List of files
   */
  async listFiles(payload: ListFilesRequest): Promise<{ files: { path: string; size: number; mimeType: string; uploadedAt: string }[] }> {
    const url = new URL(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/files`);
    if (payload.tenantId) url.searchParams.set("tenantId", payload.tenantId);
    
    const res = await fetch(url, { headers: this.headers() });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`listFiles failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
    
    return (await res.json()) as { files: { path: string; size: number; mimeType: string; uploadedAt: string }[] };
  }

  /**
   * List uploads in a project
   * @param projectId Project ID
   * @returns List of uploads
   */
  async listUploads(projectId: string): Promise<{ uploads: { id: string; path: string; status: string; createdAt: string }[] }> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(projectId)}/uploads`, {
      headers: this.headers(),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`listUploads failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
    
    return (await res.json()) as { uploads: { id: string; path: string; status: string; createdAt: string }[] };
  }

  /**
   * Migrate files to a new version
   * @param payload Migration request data
   * @returns Migration status
   */
  async migrateVersion(payload: MigrateVersionRequest): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/migrate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`migrateVersion failed: ${res.status} - ${error.error || error.message || "Unknown error"}`);
    }
    
    return (await res.json()) as { status: string };
  }

  /**
   * Get a signed image URL with transformations
   * @param args Transform options
   * @returns Signed URL for transformed image
   */
  getSignedImageUrl(args: { projectId: string; path: string; transform?: TransformOptions; version?: number }): string {
    const version = args.version ?? 1;
    const url = new URL(`${this.baseUrl}/api/v${version}/transform/${encodeURIComponent(args.projectId)}/${args.path.replace(/^\/+/, "")}`);
    
    const t = args.transform;
    if (t?.width) url.searchParams.set("w", String(t.width));
    if (t?.height) url.searchParams.set("h", String(t.height));
    if (t?.quality) url.searchParams.set("q", String(t.quality));
    if (t?.format) url.searchParams.set("f", t.format);
    if (t?.fit) url.searchParams.set("fit", t.fit);
    
    return url.toString();
  }

  /**
   * Upload a file directly (convenience method)
   * @param projectId Project ID
   * @param file File to upload
   * @param options Upload options
   * @returns Upload result
   */
  async uploadFile(
    projectId: string,
    file: File,
    options: {
      path?: string;
      tenantId?: string;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<{ path: string; url: string; size: number }> {
    // Initialize upload
    const initResult = await this.initUpload({
      projectId,
      fileName: options.path || file.name,
      tenantId: options.tenantId,
      contentType: file.type,
    });

    // Upload to storage
    const uploadResponse = await fetch(initResult.uploadUrl.url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to storage: ${uploadResponse.status}`);
    }

    // Get ETag from response
    const etag = uploadResponse.headers.get("ETag") || "";

    // Complete upload
    await this.completeUpload({
      projectId,
      uploadId: initResult.uploadId,
      metadata: {
        size: file.size,
        etag: etag.replace(/"/g, ""), // Remove quotes from ETag
        contentType: file.type,
      },
    });

    return {
      path: initResult.path,
      url: initResult.uploadUrl.url.split("?")[0] || "", // Remove query params
      size: file.size,
    };
  }
}

