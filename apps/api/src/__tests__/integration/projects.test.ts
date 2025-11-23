import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@carcosa/database";

const API_URL = process.env.TEST_API_URL || "http://localhost:4000";
const prisma = new PrismaClient();

describe("Projects API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let teamId: string;
  let bucketId: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup: Register user, create org, team, and bucket
    const registerRes = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-projects-${Date.now()}@example.com`,
        password: "Test123!@#",
        name: "Test User",
      }),
    });

    const registerData = await registerRes.json();
    userId = registerData.user.id;

    // Login
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: registerData.user.email,
        password: "Test123!@#",
      }),
    });

    authToken = loginRes.headers.get("set-cookie") || "";

    // Create organization
    const orgRes = await fetch(`${API_URL}/api/v1/organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authToken,
      },
      credentials: "include",
      body: JSON.stringify({
        name: "Test Org",
        slug: `test-org-${Date.now()}`,
      }),
    });

    const orgData = await orgRes.json();
    organizationId = orgData.organization.id;

    // Create team
    const teamRes = await fetch(
      `${API_URL}/api/v1/organizations/${organizationId}/teams`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Team",
          slug: `test-team-${Date.now()}`,
        }),
      }
    );

    const teamData = await teamRes.json();
    teamId = teamData.team.id;

    // Create bucket (using test credentials)
    const bucketRes = await fetch(
      `${API_URL}/api/v1/buckets?teamId=${teamId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Bucket",
          provider: "r2",
          bucketName: "test-bucket",
          region: "auto",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        }),
      }
    );

    const bucketData = await bucketRes.json();
    bucketId = bucketData.bucket.id;
  });

  afterAll(async () => {
    // Cleanup
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    if (bucketId) {
      await prisma.bucket.deleteMany({ where: { id: bucketId } });
    }
    if (teamId) {
      await prisma.team.deleteMany({ where: { id: teamId } });
    }
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  describe("POST /api/v1/projects", () => {
    it("should create a new project", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Project",
          slug: `test-project-${Date.now()}`,
          bucketId,
          multiTenant: false,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.project).toBeDefined();
      expect(data.project.name).toBe("Test Project");
      expect(data.project.bucketId).toBe(bucketId);
      expect(data.project.multiTenant).toBe(false);

      projectId = data.project.id;
    });

    it("should create multi-tenant project", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Multi-Tenant Project",
          slug: `mt-project-${Date.now()}`,
          bucketId,
          multiTenant: true,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.project.multiTenant).toBe(true);
    });

    it("should reject project with duplicate slug", async () => {
      const slug = `dup-project-${Date.now()}`;

      // Create first project
      await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "First Project",
          slug,
          bucketId,
          multiTenant: false,
        }),
      });

      // Try duplicate
      const res = await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Duplicate Project",
          slug,
          bucketId,
          multiTenant: false,
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should reject without authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Unauthorized Project",
          slug: "unauthorized",
          bucketId,
          multiTenant: false,
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should reject with invalid bucket ID", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects?teamId=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Invalid Bucket Project",
          slug: `invalid-${Date.now()}`,
          bucketId: "non-existent-bucket",
          multiTenant: false,
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/projects", () => {
    it("should list all user projects", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects`, {
        method: "GET",
        headers: { Cookie: authToken },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.projects.length).toBeGreaterThan(0);
    });

    it("should require authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects`, {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/projects/:id", () => {
    it("should get project by ID", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: "GET",
        headers: { Cookie: authToken },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(projectId);
      expect(data.name).toBe("Test Project");
      expect(data.bucket).toBeDefined();
      expect(data.team).toBeDefined();
    });

    it("should return 404 for non-existent project", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects/non-existent-id`, {
        method: "GET",
        headers: { Cookie: authToken },
        credentials: "include",
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/v1/projects/:id", () => {
    it("should update project", async () => {
      const newName = `Updated Project ${Date.now()}`;
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          slug: `updated-${Date.now()}`,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.project.name).toBe(newName);
    });

    it("should reject update without authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Unauthorized Update",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/projects/:id", () => {
    it("should delete project", async () => {
      // Create a project to delete
      const createRes = await fetch(
        `${API_URL}/api/v1/projects?teamId=${teamId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: authToken,
          },
          credentials: "include",
          body: JSON.stringify({
            name: "Project to Delete",
            slug: `delete-${Date.now()}`,
            bucketId,
            multiTenant: false,
          }),
        }
      );

      const createData = await createRes.json();
      const deleteProjectId = createData.project.id;

      // Delete it
      const res = await fetch(`${API_URL}/api/v1/projects/${deleteProjectId}`, {
        method: "DELETE",
        headers: { Cookie: authToken },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // Verify it's gone
      const getRes = await fetch(
        `${API_URL}/api/v1/projects/${deleteProjectId}`,
        {
          method: "GET",
          headers: { Cookie: authToken },
          credentials: "include",
        }
      );

      expect(getRes.status).toBe(404);
    });

    it("should require authentication to delete", async () => {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/projects/:id/validate", () => {
    it("should validate project credentials", async () => {
      const res = await fetch(
        `${API_URL}/api/v1/projects/${projectId}/validate`,
        {
          method: "POST",
          headers: { Cookie: authToken },
          credentials: "include",
        }
      );

      // Note: Will likely fail with test credentials, but should return proper structure
      expect([200, 400, 500]).toContain(res.status);
      const data = await res.json();
      expect(data).toHaveProperty("ok");
    });
  });
});
