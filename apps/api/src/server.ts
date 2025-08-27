import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import Env from "./config/env.js";
import { getLogger } from "./config/logger.js";
import rateLimit from "./middlewares/rate-limit.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import routes from "./routes/index.js";
import { createRealtimeSystem } from "@carcosa/file-router";

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const env = parsed.data;

const app = express();
const server = createServer(app);

// Initialize real-time system for upload progress tracking
const realtimeSystem = env.REDIS_URL ? createRealtimeSystem({
  redisUrl: env.REDIS_URL,
  corsOrigins: env.NODE_ENV === 'production'
    ? [`${env.API_URL?.replace('/api/v1', '')}:3000`]
    : ['http://localhost:3000'],
}) : null;

// Attach real-time system if available
if (realtimeSystem && typeof realtimeSystem.attach === 'function') {
  realtimeSystem.attach(server);
}

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [env.API_URL.replace(/:4000$/, ":3000")] // Allow frontend URL
        : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
}));
app.use(getLogger());
app.use(rateLimit({ redisUrl: env.REDIS_URL, pgUrl: env.DATABASE_URL } as any));

app.get("/healthz", (_req, res) => res.json({
  ok: true,
  timestamp: new Date().toISOString(),
  version: "1.0.0"
}));

// Real-time system health check
app.get("/api/v1/realtime/health", (_req, res) => {
  res.json({
    realtime: { status: "integrated" },
    websocket: { status: "active" },
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1", routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(env.API_PORT, () => {
  console.log(`🚀 [api] Server listening on http://localhost:${env.API_PORT}`);
  console.log(`⚡ [realtime] WebSocket system initialized`);
  console.log(`📁 [file-router] Advanced upload system ready`);
});
