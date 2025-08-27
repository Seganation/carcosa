import type { Request, Response } from "express";
import { prisma } from "@carcosa/database";

export async function getProjectAuditLogs(req: Request, res: Response) {
  try {
    const { id: projectId } = req.params;
    const { page = "1", limit = "50", action, resource, userId } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { projectId };
    
    if (action) {
      where.action = { contains: action as string, mode: "insensitive" };
    }
    
    if (resource) {
      where.resource = { contains: resource as string, mode: "insensitive" };
    }
    
    if (userId) {
      where.userId = userId as string;
    }

    // Get audit logs with user information
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const hasMore = skip + limitNum < total;

    return res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching project audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}

export async function getUserAuditLogs(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const { page = "1", limit = "50" } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    const hasMore = skip + limitNum < total;

    return res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch user audit logs" });
  }
}

export async function getAllAuditLogs(req: Request, res: Response) {
  try {
    // TODO: Add admin authentication check
    const { page = "1", limit = "100", projectId, action, userId } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId as string;
    }
    
    if (action) {
      where.action = { contains: action as string, mode: "insensitive" };
    }
    
    if (userId) {
      where.userId = userId as string;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const hasMore = skip + limitNum < total;

    return res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching all audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}

export async function exportAuditLogs(req: Request, res: Response) {
  try {
    const { id: projectId } = req.params;
    const { action, resource, userId, startDate, endDate } = req.query;
    
    // Build where clause
    const where: any = { projectId };
    
    if (action) {
      where.action = { contains: action as string, mode: "insensitive" };
    }
    
    if (resource) {
      where.resource = { contains: resource as string, mode: "insensitive" };
    }
    
    if (userId) {
      where.userId = userId as string;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const csvHeaders = [
      "Date",
      "Action",
      "Resource",
      "User Name",
      "User Email",
      "IP Address",
      "User Agent",
      "Details",
    ];

    const csvRows = logs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      log.resource,
      log.user.name || "",
      log.user.email || "",
      log.ipAddress || "",
      log.userAgent || "",
      log.details ? JSON.stringify(log.details) : "",
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${projectId}-${new Date().toISOString().split("T")[0]}.csv"`
    );

    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return res.status(500).json({ error: "Failed to export audit logs" });
  }
}

// Helper function to create audit log entries
export async function createAuditLog(data: {
  projectId: string;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw error for audit log failures - they shouldn't break the main flow
    return null;
  }
}
