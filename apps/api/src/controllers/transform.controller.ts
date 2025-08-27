import type { Request, Response } from "express";
import sharp from "sharp";
import { Transform as NodeTransform } from "node:stream";
import { prisma } from "@carcosa/database";
import { getAdapterForProject } from "../services/storage.service.js";
import { hashApiKey, projectTokenFromAuthHeader } from "../auth.js";
import { bumpUsage, checkProjectRateLimit } from "../services/rate.service.js";
import { createAuditLog } from "./audit-logs.controller.js";
import { recordUsage } from "./usage.controller.js";
import { serializeBigInts } from "../utils/serialization.js";

class ByteCounter extends NodeTransform {
  public bytes = 0;
  _transform(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null, data?: any) => void) {
    this.bytes += Buffer.byteLength(chunk);
    callback(null, chunk);
  }
}

export async function handle(req: Request, res: Response) {
  try {
    const version = Number((req.params as any).version);
    const projectId = (req.params as any).projectId as string;
    const pathParam = (req.params as any).path as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "project_not_found" });

    const w = req.query.w ? Number(req.query.w) : undefined;
    const h = req.query.h ? Number(req.query.h) : undefined;
    const q = req.query.q ? Number(req.query.q) : 80;
    const f = typeof req.query.f === "string" ? (req.query.f as string) : undefined;
    const fit = typeof req.query.fit === "string" ? (req.query.fit as any) : "cover";

    const token = projectTokenFromAuthHeader(req.headers.authorization);
    if (token) {
      const ok = await prisma.apiKey.findFirst({ where: { projectId, keyHash: hashApiKey(token), revokedAt: null } });
      if (!ok) return res.status(401).json({ error: "invalid_api_key" });
    }

    // Resolve storage path: ensure `${slug}/v{version}/...` prefix exists
    const clean = String(pathParam).replace(/^\/+/, "");
    let resolvedPath = clean;
    const slugPrefix = `${project.slug}/`;
    const slugVersionPrefix = `${project.slug}/v${version}/`;
    if (clean.startsWith(slugVersionPrefix)) {
      resolvedPath = clean;
    } else if (clean.startsWith(slugPrefix)) {
      const rest = clean.slice(slugPrefix.length);
      resolvedPath = `${slugVersionPrefix}${rest.replace(/^v\d+\//, "")}`;
    } else {
      resolvedPath = `${slugVersionPrefix}${clean}`;
    }

    if (!(await checkProjectRateLimit(projectId, "transforms"))) return res.status(429).json({ error: "rate_limited" });
    
    const adapter = await getAdapterForProject(projectId);
    const original = await adapter.getObject(resolvedPath);

    // Create transform record
    const transformRecord = await prisma.transform.create({
      data: {
        projectId,
        fileId: "", // We'll need to find the file ID
        originalPath: resolvedPath,
        transformPath: `${resolvedPath}?w=${w || 'auto'}&h=${h || 'auto'}&q=${q}&f=${f || 'auto'}&fit=${fit}`,
        transformOptions: { width: w, height: h, quality: q, format: f, fit },
        status: "processing",
      },
    });

    const pipeline = sharp();
    let image = original.body.pipe(pipeline);
    if (w || h) image = image.resize(w, h, { fit });
    if (f === "webp") image = image.webp({ quality: q });
    else if (f === "jpeg" || f === "jpg") image = image.jpeg({ quality: q });
    else if (f === "png") image = image.png();
    else if (f === "avif") image = image.avif({ quality: q });

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const counter = new ByteCounter();
    
    image.on("error", async (error) => {
      // Update transform record with error
      await prisma.transform.update({
        where: { id: transformRecord.id },
        data: { 
          status: "failed", 
          error: error.message 
        },
      });
      
      if (!res.headersSent) res.status(500).end();
    });
    
    image.pipe(counter).pipe(res);
    
    counter.on("finish", async () => {
      // Update transform record as completed
      await prisma.transform.update({
        where: { id: transformRecord.id },
        data: { 
          status: "completed", 
          completedAt: new Date(),
          processingTime: Date.now() - transformRecord.createdAt.getTime(),
        },
      });
      
      // Record usage
      await recordUsage(projectId, { transforms: 1, bandwidthBytes: counter.bytes });
      
      // Create audit log
      await createAuditLog({
        projectId,
        userId: "system", // TODO: Get actual user ID
        action: "transform",
        resource: resolvedPath,
        details: { 
          transformId: transformRecord.id,
          options: { width: w, height: h, quality: q, format: f, fit },
          outputSize: counter.bytes,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    });
  } catch (error) {
    console.error("Transform error:", error);
    return res.status(500).json({ error: "transform_failed" });
  }
}

// Get transforms for a project with pagination and filtering
export async function getProjectTransforms(req: Request, res: Response) {
  try {
    console.log("🔍 getProjectTransforms called with params:", req.params);
    console.log("🔍 Query params:", req.query);
    
    const { id: projectId } = req.params;
    const { page = "1", limit = "50", status, search } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    console.log("🔍 Project ID:", projectId);
    console.log("🔍 Page:", pageNum, "Limit:", limitNum, "Skip:", skip);

    // Build where clause
    const where: any = { projectId };
    
    if (status) {
      where.status = status as string;
    }
    
    if (search) {
      where.OR = [
        { originalPath: { contains: search as string, mode: "insensitive" } },
        { transformPath: { contains: search as string, mode: "insensitive" } },
      ];
    }

    console.log("🔍 Where clause:", where);

    // Check if Transform model exists
    console.log("🔍 Prisma client keys:", Object.keys(prisma));
    console.log("🔍 Transform model exists:", 'transform' in prisma);

    // Get transforms with file information
    const [transforms, total] = await Promise.all([
      prisma.transform.findMany({
        where,
        include: {
          file: {
            select: {
              id: true,
              filename: true,
              size: true,
              mimeType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.transform.count({ where }),
    ]);

    console.log("🔍 Found transforms:", transforms.length);
    console.log("🔍 Total count:", total);

    const hasMore = skip + limitNum < total;

    // Serialize the response, converting any BigInt values to numbers
    const response = {
      transforms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore,
      },
    };

    return res.json(serializeBigInts(response));
  } catch (error) {
    console.error("❌ Error fetching project transforms:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : error);
    return res.status(500).json({ error: "Failed to fetch transforms" });
  }
}

// Retry a failed transform
export async function retryTransform(req: Request, res: Response) {
  try {
    const { id: projectId, transformId } = req.params;
    
    const transform = await prisma.transform.findFirst({
      where: { id: transformId, projectId },
    });
    
    if (!transform) {
      return res.status(404).json({ error: "Transform not found" });
    }
    
    if (transform.status !== "failed") {
      return res.status(400).json({ error: "Only failed transforms can be retried" });
    }
    
    // Reset transform status
    await prisma.transform.update({
      where: { id: transformId },
      data: { 
        status: "pending",
        error: null,
        completedAt: null,
        processingTime: null,
      },
    });
    
    // Create audit log
    await createAuditLog({
      projectId: projectId!,
      userId: "system", // TODO: Get actual user ID
      action: "transform_retry",
      resource: transform.originalPath,
      details: { transformId },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    return res.json({ message: "Transform retry initiated" });
  } catch (error) {
    console.error("Error retrying transform:", error);
    return res.status(500).json({ error: "Failed to retry transform" });
  }
}

// Delete a transform
export async function deleteTransform(req: Request, res: Response) {
  try {
    const { id: projectId, transformId } = req.params;
    
    const transform = await prisma.transform.findFirst({
      where: { id: transformId, projectId },
    });
    
    if (!transform) {
      return res.status(404).json({ error: "Transform not found" });
    }
    
    // Delete the transform
    await prisma.transform.delete({
      where: { id: transformId },
    });
    
    // Create audit log
    await createAuditLog({
      projectId: projectId!,
      userId: "system", // TODO: Get actual user ID
      action: "transform_delete",
      resource: transform.originalPath,
      details: { transformId, originalPath: transform.originalPath },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    return res.json({ message: "Transform deleted successfully" });
  } catch (error) {
    console.error("Error deleting transform:", error);
    return res.status(500).json({ error: "Failed to delete transform" });
  }
}

// Get transform statistics for a project
export async function getTransformStats(req: Request, res: Response) {
  try {
    const { id: projectId } = req.params;
    
    const stats = await prisma.transform.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { status: true },
    });
    
    const total = await prisma.transform.count({ where: { projectId } });
    
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);
    
    return res.json({
      stats: {
        total,
        pending: statsMap.pending || 0,
        processing: statsMap.processing || 0,
        completed: statsMap.completed || 0,
        failed: statsMap.failed || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching transform stats:", error);
    return res.status(500).json({ error: "Failed to fetch transform stats" });
  }
}


