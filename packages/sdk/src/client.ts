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
  apiKey?: string;
}

export class CarcosaClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options: CarcosaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { "content-type": "application/json" };
    if (this.apiKey) headers["authorization"] = `Bearer ${this.apiKey}`;
    return headers;
  }

  async initUpload(payload: InitUploadRequest): Promise<InitUploadResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/uploads/init`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`initUpload failed: ${res.status}`);
    return (await res.json()) as InitUploadResponse;
  }

  async completeUpload(payload: CompleteUploadRequest): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/uploads/callback`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`completeUpload failed: ${res.status}`);
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(projectId)}/files`, {
      method: "DELETE",
      headers: this.headers(),
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error(`deleteFile failed: ${res.status}`);
  }

  async listFiles(payload: ListFilesRequest): Promise<{ files: { path: string; size: number }[] }> {
    const url = new URL(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/files`);
    if (payload.tenantId) url.searchParams.set("tenant", payload.tenantId);
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`listFiles failed: ${res.status}`);
    return (await res.json()) as { files: { path: string; size: number }[] };
  }

  async migrateVersion(payload: MigrateVersionRequest): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/${encodeURIComponent(payload.projectId)}/migrate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`migrateVersion failed: ${res.status}`);
    return (await res.json()) as { status: string };
  }

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
}

