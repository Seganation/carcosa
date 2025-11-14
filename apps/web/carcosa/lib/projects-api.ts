export type Project = {
  id: string;
  name: string;
  slug: string;
  bucketId: string;
  ownerId: string;
  multiTenant: boolean;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  bucket?: {
    id: string;
    name: string;
    provider: string;
    bucketName: string;
    region?: string;
    status: string;
  };
  team?: {
    id: string;
    name: string;
    slug: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  _count?: {
    versions: number;
    tokens: number;
  };
};

export type CreateProjectRequest = {
  name: string;
  slug: string;
  bucketId: string;
  multiTenant: boolean;
  teamId?: string;
};

export type ValidationResult = {
  ok: boolean;
  method?: string;
  status?: string;
  error?: string;
};

class ProjectsAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async list(): Promise<{ projects: Project[] }> {
    return this.request("/api/v1/projects");
  }

  async listByTeam(teamId: string): Promise<{ projects: Project[] }> {
    return this.request(`/api/v1/projects/teams/${teamId}`);
  }

  async get(id: string): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`);
  }

  async create(data: CreateProjectRequest): Promise<{ project: Project }> {
    const url = new URL(`${this.baseUrl}/api/v1/projects`);
    if (data.teamId) {
      url.searchParams.append('teamId', data.teamId);
    }
    
    return this.request(url.pathname + url.search, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<CreateProjectRequest>): Promise<{ project: Project }> {
    return this.request(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async validateCredentials(id: string): Promise<ValidationResult> {
    return this.request(`/api/v1/projects/${id}/validate`, {
      method: "POST",
    });
  }

  async delete(id: string): Promise<{ ok: boolean }> {
    return this.request(`/api/v1/projects/${id}`, {
      method: "DELETE",
    });
  }

  async transfer(id: string, newTeamId: string): Promise<{ project: Project; message: string }> {
    return this.request(`/api/v1/projects/${id}/transfer`, {
      method: "POST",
      body: JSON.stringify({ newTeamId }),
    });
  }
}

export const projectsAPI = new ProjectsAPI();
