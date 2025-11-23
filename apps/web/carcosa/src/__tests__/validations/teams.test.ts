import { describe, it, expect } from "vitest";
import { createTeamSchema } from "../../../lib/validations/teams.validation";

describe("createTeamSchema", () => {
  it("accepts valid input", () => {
    const result = createTeamSchema.safeParse({
      name: "Engineering",
      slug: "engineering",
      description: "Product team",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createTeamSchema.safeParse({
      name: "",
      slug: "team",
      description: "",
    });
    expect(result.success).toBe(false);
  });
});
