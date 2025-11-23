import { describe, it, expect } from "vitest";
import { createProjectSchema } from "../../../lib/validations/projects.validation";

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      slug: "my-project",
      bucketId: "bucket_123",
      multiTenant: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug with uppercase", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      slug: "My-Project",
      bucketId: "bucket_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bucket ID", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      slug: "my-project",
      bucketId: "",
    });
    expect(result.success).toBe(false);
  });
});
