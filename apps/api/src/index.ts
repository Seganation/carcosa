import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import sharp from "sharp";
import { z } from "zod";
import { Env as EnvSchema } from "./env.js";
import { createRateLimit } from "./rateLimit.js";
import { PrismaClient } from "@prisma/client";
import { S3Adapter, R2Adapter } from "@carcosa/storage";
import type { StorageAdapter } from "@carcosa/types";
import { decryptWithKey, encryptWithKey } from "./crypto.js";

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const env = parsed.data;

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(createRateLimit({ redisUrl: env.REDIS_URL, pgUrl: env.DATABASE_URL }));

async function getAdapterForProject(projectId: string): Promise<StorageAdapter> {
  const provider = await prisma.provider.findFirstOrThrow({ where: { projectId } });
  const accessKeyId = await decryptWithKey(env.CREDENTIALS_ENCRYPTION_KEY, provider.encryptedAccessKey);
  const secretAccessKey = await decryptWithKey(env.CREDENTIALS_ENCRYPTION_KEY, provider.encryptedSecretKey);
  const baseOptions = {
    bucketName: provider.bucketName,
    region: provider.region ?? undefined,
    endpoint: provider.endpoint ?? undefined,
    accessKeyId,
    secretAccessKey,
  };
  if (provider.type === "r2") return new R2Adapter(baseOptions);
  return new S3Adapter(baseOptions);
}

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/api/v1/projects", async (req, res) => {
  const body = z
    .object({ name: z.string(), slug: z.string(), provider: z.enum(["r2", "s3"]), bucketName: z.string(), region: z.string().optional(), endpoint: z.string().optional(), accessKeyId: z.string(), secretAccessKey: z.string() })
    .parse(req.body);
  const project = await prisma.project.create({ data: { name: body.name, slug: body.slug, provider: body.provider } });
  await prisma.provider.create({
    data: {
      projectId: project.id,
      type: body.provider,
      bucketName: body.bucketName,
      region: body.region ?? null,
      endpoint: body.endpoint ?? null,
      encryptedAccessKey: await encryptWithKey(env.CREDENTIALS_ENCRYPTION_KEY, body.accessKeyId),
      encryptedSecretKey: await encryptWithKey(env.CREDENTIALS_ENCRYPTION_KEY, body.secretAccessKey),
    },
  });
  return res.status(201).json(project);
});

app.post("/api/v1/projects/:id/uploads/init", async (req, res) => {
  const projectId = req.params.id;
  const body = z.object({ fileName: z.string(), tenantId: z.string().optional(), contentType: z.string().optional(), metadata: z.record(z.string()).optional() }).parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "project_not_found" });

  const path = project.slug + "/" + (body.tenantId ? `${body.tenantId}/` : "") + "files/" + body.fileName.replace(/^\/+/, "");
  const adapter = await getAdapterForProject(projectId);
  const uploadUrl = await adapter.getSignedPutUrl(path, { contentType: body.contentType, metadata: body.metadata });
  const upload = await prisma.upload.create({ data: { projectId, path, status: "initiated" } });
  return res.json({ uploadUrl, path, uploadId: upload.id });
});

app.post("/api/v1/uploads/callback", async (req, res) => {
  const body = z.object({ uploadId: z.string() }).parse(req.body);
  await prisma.upload.update({ where: { id: body.uploadId }, data: { status: "completed" } });
  return res.json({ ok: true });
});

app.get("/api/v1/projects/:id/files", async (req, res) => {
  const projectId = req.params.id;
  const tenant = typeof req.query.tenant === "string" ? req.query.tenant : undefined;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "project_not_found" });
  const prefix = project.slug + "/" + (tenant ? `${tenant}/` : "") + "files/";
  const adapter = await getAdapterForProject(projectId);
  const list = await adapter.listObjects(prefix);
  return res.json({ files: list.keys.map((k) => ({ path: k, size: 0 })) });
});

app.delete("/api/v1/projects/:id/files", async (req, res) => {
  const projectId = req.params.id;
  const body = z.object({ path: z.string() }).parse(req.body);
  const adapter = await getAdapterForProject(projectId);
  await adapter.deleteObject(body.path);
  return res.json({ ok: true });
});

app.post("/api/v1/projects/:id/migrate", async (req, res) => {
  const _body = z.object({ fromVersion: z.string(), toVersion: z.string() }).parse(req.body);
  return res.json({ status: "queued" });
});

app.get(/^\/api\/v(\d+)\/transform\/(.+)\/(.+)$/i, async (req, res) => {
  try {
    const version = Number((req.params as any)[0]);
    const projectId = (req.params as any)[1];
    const path = (req.params as any)[2];

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "project_not_found" });

    const w = req.query.w ? Number(req.query.w) : undefined;
    const h = req.query.h ? Number(req.query.h) : undefined;
    const q = req.query.q ? Number(req.query.q) : 80;
    const f = typeof req.query.f === "string" ? req.query.f : undefined;
    const fit = typeof req.query.fit === "string" ? (req.query.fit as any) : "cover";

    const adapter = await getAdapterForProject(projectId);
    const original = await adapter.getObject(path);

    const pipeline = sharp();
    let image = original.body.pipe(pipeline);
    if (w || h) image = image.resize(w, h, { fit });
    if (f === "webp") image = image.webp({ quality: q });
    else if (f === "jpeg" || f === "jpg") image = image.jpeg({ quality: q });
    else if (f === "png") image = image.png();
    else if (f === "avif") image = image.avif({ quality: q });

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    image.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    image.pipe(res);
  } catch {
    return res.status(500).json({ error: "transform_failed" });
  }
});

app.listen(env.API_PORT, () => {
  console.log(`[api] listening on http://localhost:${env.API_PORT}`);
});

