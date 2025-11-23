import { z } from "zod";

export const createApiKeySchema = z.object({
  label: z.string().max(100, "Label is too long").optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .refine(
      (perms) => perms.length > 0,
      "At least one permission must be selected"
    ),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
