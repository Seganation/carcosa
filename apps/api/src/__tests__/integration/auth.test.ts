import { describe, it, expect, afterEach } from "vitest";
import { PrismaClient } from "@carcosa/database";

const API_URL = process.env.TEST_API_URL || "http://localhost:4000";
const prisma = new PrismaClient();

describe("Authentication API Integration Tests", () => {
  const testEmails: string[] = [];

  afterEach(async () => {
    // Cleanup test users
    if (testEmails.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: testEmails } },
      });
      testEmails.length = 0;
    }
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const email = `test-${Date.now()}@example.com`;
      testEmails.push(email);

      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "Test User",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(email);
      expect(data.user.name).toBe("Test User");
      expect(data.user.password).toBeUndefined(); // Password should not be returned
      expect(data.token).toBeDefined(); // Should return JWT token
    });

    it("should reject registration with existing email", async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      testEmails.push(email);

      // First registration
      await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "First User",
        }),
      });

      // Duplicate registration
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "Duplicate User",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("email");
    });

    it("should reject registration with weak password", async () => {
      const email = `weak-pass-${Date.now()}@example.com`;
      testEmails.push(email);

      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "123", // Too weak
          name: "Test User",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should reject registration with invalid email", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "SecurePass123!",
          name: "Test User",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("email");
    });

    it("should reject registration without required fields", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          // Missing password
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = "SecurePass123!";

    beforeEach(async () => {
      testEmails.push(testEmail);
      // Create a test user
      await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: "Login Test User",
        }),
      });
    });

    it("should login with valid credentials", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.token).toBeDefined();

      // Should set cookie
      const cookies = res.headers.get("set-cookie");
      expect(cookies).toBeDefined();
      expect(cookies).toContain("token");
    });

    it("should reject login with wrong password", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "WrongPassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should reject login with non-existent email", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `nonexistent-${Date.now()}@example.com`,
          password: "SomePassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should reject login without credentials", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout user", async () => {
      // First login
      const email = `logout-test-${Date.now()}@example.com`;
      testEmails.push(email);

      await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "Logout Test",
        }),
      });

      const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
        }),
      });

      const cookies = loginRes.headers.get("set-cookie");

      // Logout
      const res = await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Cookie: cookies || "" },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBeDefined();

      // Cookie should be cleared
      const logoutCookies = res.headers.get("set-cookie");
      expect(logoutCookies).toBeDefined();
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const email = `me-test-${Date.now()}@example.com`;
      testEmails.push(email);

      // Register and login
      await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "Me Test User",
        }),
      });

      const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
        }),
      });

      const cookies = loginRes.headers.get("set-cookie");

      // Get current user
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: { Cookie: cookies || "" },
        credentials: "include",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(email);
      expect(data.user.name).toBe("Me Test User");
      expect(data.user.password).toBeUndefined();
    });

    it("should return 401 when not authenticated", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/auth/profile", () => {
    it("should update user profile", async () => {
      const email = `profile-test-${Date.now()}@example.com`;
      testEmails.push(email);

      // Register and login
      await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
          name: "Original Name",
        }),
      });

      const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password: "SecurePass123!",
        }),
      });

      const cookies = loginRes.headers.get("set-cookie");

      // Update profile
      const res = await fetch(`${API_URL}/api/v1/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies || "",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.name).toBe("Updated Name");
    });

    it("should require authentication", async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(401);
    });
  });
});
