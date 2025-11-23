import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
  logo: z.string().url("Logo must be a valid URL").optional().or(z.literal("")),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
