import { z } from "zod";

export const listFilesSchema = z.object({
  path: z.string().optional(),
  tenantId: z.string().optional(),
  version: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const deleteFilesSchema = z.object({
  paths: z.array(z.string().min(1)),
  tenantId: z.string().optional(),
});

export type ListFilesInput = z.infer<typeof listFilesSchema>;
export type DeleteFilesInput = z.infer<typeof deleteFilesSchema>;
