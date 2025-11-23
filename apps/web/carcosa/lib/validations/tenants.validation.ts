import { z } from "zod";

export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  name: z.string().max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
});

export const updateTenantSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  name: z.string().max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
