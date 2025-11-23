import { describe, it, expect } from "vitest";
import { createApiKeySchema } from "../../../lib/validations/api-keys.validation";

describe("createApiKeySchema", () => {
  it("accepts valid input with label", () => {
    const result = createApiKeySchema.safeParse({
      label: "Production API Key",
      permissions: ["read", "write"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without label", () => {
    const result = createApiKeySchema.safeParse({
      permissions: ["read"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty permissions array", () => {
    const result = createApiKeySchema.safeParse({
      label: "Test Key",
      permissions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too long label", () => {
    const result = createApiKeySchema.safeParse({
      label: "a".repeat(101),
      permissions: ["read"],
    });
    expect(result.success).toBe(false);
  });
});
