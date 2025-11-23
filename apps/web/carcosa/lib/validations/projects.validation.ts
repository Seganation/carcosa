import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  bucketId: z.string().min(1, "Bucket is required"),
  teamId: z.string().optional(),
  multiTenant: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
  multiTenant: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
