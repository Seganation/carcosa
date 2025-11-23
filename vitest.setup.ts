import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/carcosa_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long';
  process.env.CREDENTIALS_ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'base64:dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcy1sb25n';
  process.env.API_URL = process.env.API_URL || 'http://localhost:4000';
  process.env.API_PORT = process.env.API_PORT || '4000';
});

// Cleanup after all tests
afterAll(() => {
  // Add any global cleanup here
});

// Cleanup after each test
afterEach(() => {
  // Add per-test cleanup here (e.g., clear mocks)
});
