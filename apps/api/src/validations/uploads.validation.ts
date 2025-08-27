import { z } from "zod";

export const initUploadSchema = z.object({
  projectId: z.string().min(1),
  fileName: z.string().min(1),
  tenantId: z.string().optional(),
  contentType: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const uploadCallbackSchema = z.object({
  projectId: z.string().min(1),
  uploadId: z.string().min(1),
  metadata: z.object({
    size: z.number().positive(),
    contentType: z.string().min(1),
    etag: z.string().min(1),
  }).optional(),
});

export type InitUploadInput = z.infer<typeof initUploadSchema>;
export type UploadCallbackInput = z.infer<typeof uploadCallbackSchema>;
