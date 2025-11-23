import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from root of monorepo (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import Env from "./config/env.js";
import { getLogger } from "./config/logger.js";
import rateLimit from "./middlewares/rate-limit.js";
import { errorHandler, notFoundHandler } from "./utils/errors.js";
import routes from "./routes/index.js";
import { realtimeSystem } from "./routes/carcosa-file-router.routes.js";
import { getRedisClient } from "./utils/redis.js";
import { swaggerSpec } from "./config/swagger.js";

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const env = parsed.data;

const app = express();
const server = createServer(app);

// Initialize Redis client for caching
const redisClient = getRedisClient();
if (redisClient) {
  console.log("✅ [redis] Cache system initialized");
} else {
  console.log("⚠️  [redis] Cache system disabled (Redis not configured)");
}

// Initialize real-time WebSocket system
realtimeSystem.initialize(server);
console.log("✅ [realtime] WebSocket system attached to HTTP server");

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://carcosa.rawadara.com", env.API_URL] // Allow frontend URL
        : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    abortOnLimit: true,
  })
);
app.use(getLogger());
app.use(rateLimit({ redisUrl: env.REDIS_URL, pgUrl: env.DATABASE_URL } as any));

app.get("/healthz", (_req, res) =>
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
);

// Real-time system health check
app.get("/api/v1/realtime/health", (_req, res) => {
  res.json({
    realtime: { status: "integrated" },
    websocket: { status: "active" },
    timestamp: new Date().toISOString(),
  });
});

// API Documentation with Swagger UI
app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Carcosa API Documentation",
    customfavIcon: "https://swagger.io/favicon-32x32.png",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

// OpenAPI spec JSON endpoint
app.get("/api/v1/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1", routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(env.API_PORT, "0.0.0.0", () => {
  console.log(`🚀 [api] Server listening on http://0.0.0.0:${env.API_PORT}`);
  console.log(`⚡ [realtime] WebSocket system initialized`);
  console.log(`📁 [file-router] Advanced upload system ready`);
});
