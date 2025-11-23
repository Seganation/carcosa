import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@carcosa/database";
import type { Express } from "express";

// Note: This test requires the API server to be running
// Run with: npm run dev (in another terminal)
// Or start API only: npm run --workspace @carcosa/api dev

const API_URL = process.env.TEST_API_URL || "http://localhost:4000";
const prisma = new PrismaClient();

describe("Organizations API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let teamId: string;

  beforeAll(async () => {
    // Register a test user and get auth token
    const registerRes = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: "Test123!@#",
        name: "Test User",
      }),
    });

    expect(registerRes.ok).toBe(true);
    const registerData = await registerRes.json();
    userId = registerData.user.id;

    // Login to get token
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: registerData.user.email,
        password: "Test123!@#",
      }),
    });

    expect(loginRes.ok).toBe(true);
    const cookies = loginRes.headers.get("set-cookie");
    authToken = cookies || "";
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (organizationId) {
      await prisma.organization.deleteMany({
        where: { id: organizationId },
      });
    }
    if (userId) {
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    }
    await prisma.$disconnect();
  });

  describe("POST /api/v1/organizations", () => {
    it("should create a new organization", async () => {
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Organization",
          slug: `test-org-${Date.now()}`,
          description: "A test organization for integration tests",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.organization).toBeDefined();
      expect(data.organization.name).toBe("Test Organization");
      expect(data.organization.slug).toMatch(/^test-org-/);

      organizationId = data.organization.id;
    });

    it("should reject organization with duplicate slug", async () => {
      const slug = `duplicate-${Date.now()}`;

      // Create first org
      await fetch(`${API_URL}/api/v1/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "First Org",
          slug,
        }),
      });

      // Try to create duplicate
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Second Org",
          slug,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("slug");
    });

    it("should reject without authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Unauthorized Org",
          slug: "unauthorized",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/organizations", () => {
    it("should list user organizations", async () => {
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "GET",
        headers: { Cookie: authToken },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.organizations)).toBe(true);
      expect(data.organizations.length).toBeGreaterThan(0);
      expect(data.organizations[0]).toHaveProperty("name");
      expect(data.organizations[0]).toHaveProperty("slug");
    });

    it("should require authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/organizations/:id", () => {
    it("should update organization", async () => {
      const newName = `Updated Org ${Date.now()}`;
      const res = await fetch(
        `${API_URL}/api/v1/organizations/${organizationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: authToken,
          },
          credentials: "include",
          body: JSON.stringify({
            name: newName,
            description: "Updated description",
          }),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.organization.name).toBe(newName);
      expect(data.organization.description).toBe("Updated description");
    });

    it("should reject invalid organization id", async () => {
      const res = await fetch(`${API_URL}/api/v1/organizations/invalid-id`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: authToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe("Teams Management", () => {
    describe("POST /api/v1/organizations/:organizationId/teams", () => {
      it("should create a team", async () => {
        const res = await fetch(
          `${API_URL}/api/v1/organizations/${organizationId}/teams`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: authToken,
            },
            credentials: "include",
            body: JSON.stringify({
              name: "Engineering Team",
              slug: `eng-team-${Date.now()}`,
              description: "Engineering team for testing",
            }),
          }
        );

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.team).toBeDefined();
        expect(data.team.name).toBe("Engineering Team");
        expect(data.team.organizationId).toBe(organizationId);

        teamId = data.team.id;
      });

      it("should reject team with missing required fields", async () => {
        const res = await fetch(
          `${API_URL}/api/v1/organizations/${organizationId}/teams`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: authToken,
            },
            credentials: "include",
            body: JSON.stringify({
              name: "Incomplete Team",
              // Missing slug
            }),
          }
        );

        expect(res.status).toBe(400);
      });
    });

    describe("GET /api/v1/organizations/teams", () => {
      it("should list user teams", async () => {
        const res = await fetch(`${API_URL}/api/v1/organizations/teams`, {
          method: "GET",
          headers: { Cookie: authToken },
          credentials: "include",
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data.teams)).toBe(true);
        expect(data.teams.length).toBeGreaterThan(0);
      });
    });

    describe("PATCH /api/v1/organizations/teams/:id", () => {
      it("should update team", async () => {
        const newName = `Updated Team ${Date.now()}`;
        const res = await fetch(
          `${API_URL}/api/v1/organizations/teams/${teamId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: authToken,
            },
            credentials: "include",
            body: JSON.stringify({
              name: newName,
              description: "Updated team description",
            }),
          }
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.team.name).toBe(newName);
      });
    });
  });

  describe("Organization Members", () => {
    describe("GET /api/v1/organizations/:id/members", () => {
      it("should list organization members", async () => {
        const res = await fetch(
          `${API_URL}/api/v1/organizations/${organizationId}/members`,
          {
            method: "GET",
            headers: { Cookie: authToken },
            credentials: "include",
          }
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data.members)).toBe(true);
        expect(data.members.length).toBeGreaterThan(0);
        expect(data.members[0]).toHaveProperty("role");
        expect(data.members[0]).toHaveProperty("user");
      });
    });
  });
});
