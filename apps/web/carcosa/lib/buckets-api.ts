const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Bucket {
  id: string;
  name: string;
  description?: string;
  provider: "s3" | "r2";
  bucketName: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  status: "pending" | "testing" | "connected" | "error";
  lastChecked?: string;
  createdAt: string;
  updatedAt?: string;
  ownerTeam: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  sharedTeams: BucketTeamAccess[];
  projects?: {
    id: string;
    name: string;
    slug: string;
    team?: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    projects: number;
  };
}

export interface BucketTeamAccess {
  id: string;
  bucketId: string;
  teamId: string;
  accessLevel: "READ_ONLY" | "READ_WRITE" | "ADMIN";
  createdAt: string;
  team: {
    id: string;
    name: string;
    slug: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CreateBucketData {
  name: string;
  provider: "s3" | "r2";
  bucketName: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UpdateBucketData {
  name?: string;
  description?: string;
  endpoint?: string;
  bucketName?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

class BucketsAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    console.log("🌐 Making request to:", url);
    console.log("🔑 Request options:", { credentials: "include", ...options });
    
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("❌ API Error:", error);
      throw new Error(error.error || "API request failed");
    }

    const data = await response.json();
    console.log("✅ API Response data:", data);
    return data;
  }

  async list(): Promise<{ buckets: Bucket[] }> {
    return this.request("/api/v1/buckets");
  }

  async get(id: string): Promise<Bucket> {
    return this.request(`/api/v1/buckets/${id}`);
  }

  async create(data: CreateBucketData, teamId: string): Promise<{ bucket: Bucket }> {
    return this.request(`/api/v1/buckets?teamId=${teamId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateBucketData): Promise<{ bucket: Bucket }> {
    return this.request(`/api/v1/buckets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async rotateCredentials(
    id: string,
    accessKeyId: string,
    secretAccessKey: string
  ): Promise<{ bucket: Bucket; message: string }> {
    return this.request(`/api/v1/buckets/${id}/rotate-credentials`, {
      method: "POST",
      body: JSON.stringify({ accessKeyId, secretAccessKey }),
    });
  }

  async validate(
    id: string
  ): Promise<{ ok: boolean; status: string; method?: string; error?: string }> {
    return this.request(`/api/v1/buckets/${id}/validate`, {
      method: "POST",
    });
  }

  async delete(id: string): Promise<{ ok: boolean }> {
    return this.request(`/api/v1/buckets/${id}`, {
      method: "DELETE",
    });
  }

  // Bucket sharing methods
  async grantTeamAccess(bucketId: string, teamId: string, accessLevel: "READ_ONLY" | "READ_WRITE" | "ADMIN"): Promise<{ access: BucketTeamAccess }> {
    return this.request(`/api/v1/buckets/${bucketId}/access`, {
      method: "POST",
      body: JSON.stringify({ teamId, accessLevel }),
    });
  }

  async revokeTeamAccess(bucketId: string, teamId: string): Promise<{ ok: boolean }> {
    return this.request(`/api/v1/buckets/${bucketId}/access/${teamId}`, {
      method: "DELETE",
    });
  }

  async getAvailableTeams(bucketId: string): Promise<{ teams: Team[] }> {
    return this.request(`/api/v1/buckets/${bucketId}/available-teams`);
  }

  async getTeamBuckets(teamId: string): Promise<{ buckets: Bucket[] }> {
    return this.request(`/api/v1/teams/${teamId}/buckets`);
  }
}

export const bucketsAPI = new BucketsAPI();
