import { Request, Response } from "express";
import { prisma } from "@carcosa/database";
import { UsageService } from "../services/usage.service.js";

const usageService = new UsageService();

// Record usage for a project (used by other controllers)
export async function recordUsage(projectId: string, usage: { uploads?: number; transforms?: number; bandwidthBytes?: number }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Upsert daily usage record
    await prisma.usageDaily.upsert({
      where: {
        projectId_day: { projectId, day: today }
      },
      update: {
        uploads: { increment: usage.uploads || 0 },
        transforms: { increment: usage.transforms || 0 },
        bandwidthBytes: { increment: usage.bandwidthBytes || BigInt(0) }
      },
      create: {
        projectId,
        day: today,
        uploads: usage.uploads || 0,
        transforms: usage.transforms || 0,
        bandwidthBytes: usage.bandwidthBytes || BigInt(0)
      }
    });
  } catch (error) {
    console.error("Error recording usage:", error);
    // Don't throw - usage recording failure shouldn't break main operations
  }
}

export async function dailyForProject(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id: projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "missing_project_id" });
    }
    
    console.log("🔍 dailyForProject called with:", { projectId, userId: req.userId });
    
    const { range = "30d" } = req.query;
    
    // Calculate days based on range
    let days = 30;
    switch (range) {
      case "7d":
        days = 7;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    console.log("📅 Getting daily usage for", days, "days");
    const usage = await usageService.getDailyUsage(projectId, req.userId, days);
    console.log("📈 Daily usage result:", usage.length, "days");
    
    console.log("📊 Getting project stats");
    const stats = await usageService.getProjectStats(projectId, req.userId);
    console.log("📈 Project stats result:", stats);

    return res.json({ 
      usage,
      stats,
      range: range as string
    });
  } catch (error) {
    console.error("❌ Error in dailyForProject:", error);
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("Error fetching project usage:", error);
    return res.status(500).json({ error: "Failed to fetch usage data" });
  }
}

// Get usage breakdown by tenant
export async function getProjectUsageByTenant(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id: projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "missing_project_id" });
    }
    
    const { range = "30d" } = req.query;
    
    // Calculate days based on range
    let days = 30;
    switch (range) {
      case "7d":
        days = 7;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    // Get project to verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId },
    });

    if (!project) {
      return res.status(404).json({ error: "project_not_found" });
    }

    // Get usage grouped by tenant
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tenantUsage = await prisma.tenant.findMany({
      where: {
        projectId,
        createdAt: { gte: startDate }
      }
    });

    // Get file and transform counts for each tenant
    const tenantStats = await Promise.all(
      tenantUsage.map(async (tenant: any) => {
        const [fileCount, transformCount] = await Promise.all([
          prisma.file.count({ where: { projectId, tenantId: tenant.id } }),
          prisma.transform.count({ where: { projectId, file: { tenantId: tenant.id } } })
        ]);
        
        return {
          id: tenant.id,
          slug: tenant.slug,
          metadata: tenant.metadata,
          createdAt: tenant.createdAt,
          usage: {
            files: fileCount,
            transforms: transformCount
          }
        };
      })
    );

    return res.json({
      tenants: tenantStats,
      range: range as string
    });
  } catch (error) {
    console.error("Error fetching tenant usage:", error);
    return res.status(500).json({ error: "Failed to fetch tenant usage data" });
  }
}








