import type { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { Pool } from "pg";

export function createRateLimit(opts: { redisUrl?: string; pgUrl: string }) {
  const redis = opts.redisUrl ? new (Redis as any)(opts.redisUrl) : null;
  const pg = !redis ? new Pool({ connectionString: opts.pgUrl }) : null;

  const tableReady = (async () => {
    if (!pg) return;
    await pg.query(
      `CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL);`
    );
  })();

  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = `rl:${req.headers["authorization"] ?? req.ip}`;
    const windowMs = 60_000; // 1 minute
    const limit = 120; // 120 req/min

    try {
      if (redis) {
        const ttl = await redis.pttl(key);
        const count = Number((await redis.incr(key)) ?? 0);
        if (count === 1) await redis.pexpire(key, windowMs);
        if (count > limit) {
          const retryAfter = Math.ceil((ttl > 0 ? ttl : windowMs) / 1000);
          res.setHeader("Retry-After", String(retryAfter));
          return res.status(429).json({ error: "rate_limited" });
        }
        return next();
      } else if (pg) {
        await tableReady;
        const now = new Date();
        const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
        const { rows } = await pg.query("SELECT count FROM rate_limits WHERE key=$1", [key]);
        let count = rows[0]?.count ?? 0;
        if (rows.length === 0) {
          count = 1;
          await pg.query(
            "INSERT INTO rate_limits(key, window_start, count) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET window_start=EXCLUDED.window_start, count=rate_limits.count+1",
            [key, windowStart, count]
          );
        } else {
          await pg.query("UPDATE rate_limits SET count=count+1, window_start=$2 WHERE key=$1", [key, windowStart]);
          count += 1;
        }
        if (count > limit) return res.status(429).json({ error: "rate_limited" });
        return next();
      } else {
        return next();
      }
    } catch {
      return next();
    }
  };
}

