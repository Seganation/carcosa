import { z } from "zod";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from root of monorepo BEFORE parsing env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

export const Env = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.coerce.number().default(4000),
    API_URL: z.string().url().default("http://localhost:4000"),

    // SECURITY: No default secrets - must be provided via environment variables
    // Minimum 16 characters for API_SECRET, 32 for JWT_SECRET
    API_SECRET: z.string().min(16, "API_SECRET must be at least 16 characters"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    REDIS_URL: z.string().url().optional(),

    // Required for encrypting bucket credentials
    // Format: base64:<base64-encoded-32-byte-key>
    // Use: node -e "console.log('base64:' + require('crypto').randomBytes(32).toString('base64'))"
    CREDENTIALS_ENCRYPTION_KEY: z
      .string()
      .regex(/^base64:[A-Za-z0-9+/]{43}=$/,
        "CREDENTIALS_ENCRYPTION_KEY must be base64:<base64-encoded-32-byte-key>"),

    // Frontend URL for CORS configuration
    FRONTEND_URL: z.string().url().optional().default("http://localhost:3000"),

    MINIO_ENDPOINT: z.string().optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    MINIO_BUCKET: z.string().optional(),
  })
  .transform((e) => ({ ...e, API_PORT: Number(e.API_PORT) }));

export type Env = z.infer<typeof Env>;

// Parse and export environment
export const env = Env.parse(process.env);
