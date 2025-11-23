import { describe, it, expect } from "vitest";
import { createOrganizationSchema } from "../../../lib/validations/organizations.validation";

describe("createOrganizationSchema", () => {
  it("accepts valid input", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Acme Corp",
      slug: "acme-corp",
      description: "A sample organization",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Acme",
      slug: "Invalid Slug!",
      description: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Slug may only");
    }
  });
});
