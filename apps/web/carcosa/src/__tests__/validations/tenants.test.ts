import { describe, it, expect } from "vitest";
import { createTenantSchema } from "../../../lib/validations/tenants.validation";

describe("createTenantSchema", () => {
  it("accepts valid tenant with all fields", () => {
    const result = createTenantSchema.safeParse({
      slug: "tenant-abc",
      name: "Customer ABC",
      description: "ABC Corporation workspace",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid tenant with only slug", () => {
    const result = createTenantSchema.safeParse({
      slug: "tenant-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug with uppercase", () => {
    const result = createTenantSchema.safeParse({
      slug: "Tenant-ABC",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug with special characters", () => {
    const result = createTenantSchema.safeParse({
      slug: "tenant_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = createTenantSchema.safeParse({
      slug: "",
    });
    expect(result.success).toBe(false);
  });
});
