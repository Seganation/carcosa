import { z } from "zod";

export const createTenantSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  metadata: z.record(z.any()).optional(),
});

export const updateTenantSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
