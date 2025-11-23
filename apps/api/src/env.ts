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
    API_SECRET: z.string().min(8).default("supersecret"),
    JWT_SECRET: z
      .string()
      .min(32)
      .default("your-super-secret-jwt-key-change-this-in-production"),

    DATABASE_URL: z.string().optional(),

    REDIS_URL: z.string().url().optional(),

    // Required for encrypting/decrypting user-provided bucket credentials
    CREDENTIALS_ENCRYPTION_KEY: z.string().startsWith("base64:").min(10).default("base64:testkeyfortestingonly123456789"),
  })
  .transform((e) => ({ ...e, API_PORT: Number(e.API_PORT) }));

export type Env = z.infer<typeof Env>;

// Parse and export environment
export const env = Env.parse(process.env);
