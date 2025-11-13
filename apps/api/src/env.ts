import { z } from "zod";

export const Env = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.coerce.number().default(4000),
    API_URL: z.string().url().default("http://localhost:4000"),
    API_SECRET: z.string().min(8).default("supersecret"),
    JWT_SECRET: z
      .string()
      .min(32)
      .default("your-super-secret-jwt-key-change-this-in-production"),

    DATABASE_URL: z.string().optional(),

    REDIS_URL: z.string().url().optional(),

    // Required for encrypting bucket credentials
    CREDENTIALS_ENCRYPTION_KEY: z.string().startsWith("base64:").min(10).default("base64:testkeyfortestingonly123456789"),

    MINIO_ENDPOINT: z.string().optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    MINIO_BUCKET: z.string().optional(),
  })
  .transform((e) => ({ ...e, API_PORT: Number(e.API_PORT) }));

export type Env = z.infer<typeof Env>;
