import { prisma } from "@carcosa/database";

export class UsageService {
  async getDailyUsage(projectId: string, ownerId: string, days: number = 30) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usage = await prisma.usageDaily.findMany({
      where: {
        projectId,
        day: {
          gte: startDate,
        },
      },
      orderBy: { day: "asc" },
    });

    // Fill in missing days with zero values
    const filledUsage = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= new Date()) {
      const existingUsage = usage.find(u => 
        u.day.toDateString() === currentDate.toDateString()
      );
      
      filledUsage.push({
        day: new Date(currentDate),
        uploads: existingUsage?.uploads || 0,
        transforms: existingUsage?.transforms || 0,
        bandwidthBytes: Number(existingUsage?.bandwidthBytes || BigInt(0)),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledUsage;
  }

  async getProjectStats(projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsage, totalFiles, totalTransforms] = await Promise.all([
      prisma.usageDaily.findUnique({
        where: { projectId_day: { projectId, day: today } },
      }),
      prisma.file.count({ where: { projectId } }),
      prisma.transform.count({ where: { projectId } }),
    ]);

    return {
      today: {
        uploads: todayUsage?.uploads || 0,
        transforms: todayUsage?.transforms || 0,
        bandwidthBytes: Number(todayUsage?.bandwidthBytes || BigInt(0)),
      },
      total: {
        files: totalFiles,
        transforms: totalTransforms,
      },
    };
  }

  async getUsageByPeriod(projectId: string, ownerId: string, startDate: Date, endDate: Date) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.usageDaily.findMany({
      where: {
        projectId,
        day: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { day: "asc" },
    });
  }

  async getUsageBreakdown(projectId: string, ownerId: string, period: "day" | "week" | "month" = "day") {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "day":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return this.getUsageByPeriod(projectId, ownerId, startDate, endDate);
  }
}

export const usageService = new UsageService();
