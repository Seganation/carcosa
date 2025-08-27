import type { Request, Response } from "express";
import { projectsService } from "../services/projects.service.js";
import { z } from "zod";

// Use global Request interface

export async function getConfig(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const config = await projectsService.getRateLimit(projectId, req.userId);
    return res.json({ config });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("Get rate limit config error:", error);
    return res.status(500).json({ error: "failed_to_get_rate_limit_config" });
  }
}

export async function upsert(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = z
      .object({
        uploadsPerMinute: z.number().int().positive(),
        transformsPerMinute: z.number().int().positive(),
        bandwidthPerMonthMiB: z.number().int().positive().nullable().optional()
      })
      .parse(req.body);

    const config = await projectsService.upsertRateLimit(projectId, body, req.userId);
    return res.json({ config });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("Upsert rate limit config error:", error);
    return res.status(500).json({ error: "failed_to_upsert_rate_limit_config" });
  }
}


