import type { Request, Response, NextFunction } from "express";

export function createRateLimit(opts: { redisUrl?: string; pgUrl: string }) {
  // For now, just return a pass-through middleware to disable rate limiting
  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Rate limiting disabled for development
    return next();
  };
}
