import type { Request, Response } from "express";
import { projectsService } from "../services/projects.service.js";
import { z } from "zod";
import { getRateLimitStats, resetRateLimit, resetAllRateLimits } from '../middlewares/advanced-rate-limit.js';
import { requireUserId } from '../utils/type-guards.js';

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

/**
 * Get rate limit statistics (in-memory rate limiter)
 *
 * Shows performance and usage of the in-memory rate limiter
 */
export async function getStats(req: Request, res: Response) {
  try {
    const stats = getRateLimitStats();

    return res.json({
      ...stats,
      timestamp: new Date().toISOString(),
      healthStatus: stats.entries < stats.maxEntries * 0.9 ? 'healthy' : 'warning',
    });
  } catch (error) {
    console.error('Get rate limit stats error:', error);
    return res.status(500).json({
      error: 'failed_to_get_stats',
      message: 'Failed to retrieve rate limit statistics',
    });
  }
}

/**
 * Reset rate limit for a specific key
 *
 * Admin only - allows manually clearing rate limit for a user/IP
 */
export async function resetLimit(req: Request, res: Response) {
  try {
    requireUserId(req); // Ensure authenticated

    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Key is required and must be a string',
      });
    }

    resetRateLimit(key);

    return res.json({
      success: true,
      message: `Rate limit reset for key: ${key}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Reset rate limit error:', error);
    return res.status(500).json({
      error: 'failed_to_reset',
      message: 'Failed to reset rate limit',
    });
  }
}

/**
 * Reset all rate limits
 *
 * Admin only - clears all rate limit data (use with caution)
 */
export async function resetAllLimits(req: Request, res: Response) {
  try {
    requireUserId(req); // Ensure authenticated

    resetAllRateLimits();

    return res.json({
      success: true,
      message: 'All rate limits have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Reset all rate limits error:', error);
    return res.status(500).json({
      error: 'failed_to_reset_all',
      message: 'Failed to reset all rate limits',
    });
  }
}


