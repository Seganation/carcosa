/**
 * In-Memory Rate Limiter with Sliding Window Algorithm
 *
 * Features:
 * - Fast in-memory storage using Map
 * - LRU eviction to prevent memory leaks
 * - Sliding window algorithm for accurate rate limiting
 * - Per-user and per-IP rate limiting
 * - Configurable limits and windows
 * - Rate limit headers (X-RateLimit-*)
 */

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  timestamps: number[]; // Array of request timestamps (Unix ms)
  lastAccess: number; // Last access timestamp for LRU eviction
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Optional prefix for rate limit keys
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp (ms)
  retryAfter?: number; // Seconds until reset (only when rate limited)
}

/**
 * In-memory rate limiter with LRU eviction
 */
export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxEntries: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
    this.startCleanup();
  }

  /**
   * Check and consume rate limit for a key
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [], lastAccess: now };
      this.store.set(key, entry);
    }

    // Update last access for LRU
    entry.lastAccess = now;

    // Remove timestamps outside the window (sliding window)
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    // Calculate remaining requests
    const currentCount = entry.timestamps.length;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    // Determine if request is allowed
    const allowed = currentCount < config.maxRequests;

    // If allowed, record this request
    if (allowed) {
      entry.timestamps.push(now);
    }

    // Calculate reset time (when oldest timestamp expires)
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTime = oldestTimestamp + config.windowMs;

    // Calculate retry after (only when rate limited)
    let retryAfter: number | undefined;
    if (!allowed) {
      retryAfter = Math.ceil((resetTime - now) / 1000);
    }

    // Enforce max entries limit (LRU eviction)
    if (this.store.size > this.maxEntries) {
      this.evictOldest();
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Get current stats for a key
   */
  getStats(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const entry = this.store.get(key);
    if (!entry) {
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    const currentCount = entry.timestamps.length;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTime = oldestTimestamp + config.windowMs;

    return {
      allowed: currentCount < config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetTime,
    };
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    let totalTimestamps = 0;
    for (const entry of this.store.values()) {
      totalTimestamps += entry.timestamps.length;
    }

    return {
      entries: this.store.size,
      maxEntries: this.maxEntries,
      totalTimestamps,
      memoryUsageEstimate: this.store.size * 100 + totalTimestamps * 8, // Rough estimate in bytes
    };
  }

  /**
   * Evict oldest entries (LRU)
   */
  private evictOldest(): void {
    const entriesToEvict = Math.ceil(this.maxEntries * 0.1); // Evict 10% of entries
    const entries = Array.from(this.store.entries());

    // Sort by lastAccess (oldest first)
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    // Remove oldest entries
    for (let i = 0; i < entriesToEvict && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        this.store.delete(entry[0]);
      }
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Don't keep process alive just for cleanup
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.store.entries()) {
      // Remove entries with no recent timestamps
      if (entry.timestamps.length === 0 || entry.lastAccess < now - maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop the rate limiter and cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Singleton instance for global rate limiting
 */
export const globalRateLimiter = new InMemoryRateLimiter();
