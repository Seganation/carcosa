import { z } from "zod";

export const createBucketSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  provider: z.enum(["s3", "r2"], { errorMap: () => ({ message: "Provider must be S3 or R2" }) }),
  region: z.string().min(1, "Region is required"),
  bucketName: z.string().min(1, "Bucket name is required"),
  endpoint: z.string().url("Invalid endpoint URL").optional().or(z.literal("")),
  accessKeyId: z.string().min(1, "Access key is required"),
  secretAccessKey: z.string().min(1, "Secret key is required"),
  teamId: z.string().optional(),
});

export type CreateBucketInput = z.infer<typeof createBucketSchema>;
