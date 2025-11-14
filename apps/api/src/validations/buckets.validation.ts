import { z } from "zod";

export const createBucketSchema = z.object({
  name: z.string().min(1, "Bucket name is required"),
  provider: z.enum(["s3", "r2"], {
    errorMap: () => ({ message: "Provider must be s3 or r2" }),
  }),
  bucketName: z.string().min(1, "Bucket name is required"),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
});

export const updateBucketSchema = z.object({
  name: z.string().min(1).optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  // Note: Provider and bucketName cannot be changed after creation
  // Credentials should be updated via the rotate-credentials endpoint
});

export const rotateBucketCredentialsSchema = z.object({
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
});
