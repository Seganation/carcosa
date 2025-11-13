import Redis from 'ioredis';
import { env } from '../env.js';

/**
 * Redis Client Singleton
 *
 * Provides a centralized Redis client for caching, pub/sub, and rate limiting.
 * Falls back gracefully when Redis is unavailable (development/testing).
 */

// Using any to bypass ioredis CJS/ESM interop type issues
type RedisClient = any;

let redisClient: RedisClient | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client with retry logic and error handling
 */
export function getRedisClient(): RedisClient | null {
  // Return existing client if already initialized
  if (redisClient) return redisClient;

  // Check if Redis URL is configured
  if (!env.REDIS_URL) {
    console.warn('⚠️  Redis URL not configured - caching will be disabled');
    return null;
  }

  try {
    // @ts-ignore - ioredis has complex CJS/ESM interop
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        console.log(`🔄 Redis reconnecting (attempt ${times}) in ${delay}ms`);
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect when encountering READONLY error
          return true;
        }
        return false;
      },
    });

    // Handle connection events
    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    client.on('ready', () => {
      console.log('✅ Redis ready for operations');
      isRedisAvailable = true;
    });

    client.on('error', (error: Error) => {
      console.error('❌ Redis connection error:', error.message);
      isRedisAvailable = false;
    });

    client.on('close', () => {
      console.warn('⚠️  Redis connection closed');
      isRedisAvailable = false;
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient = client;

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null && redisClient.status === 'ready';
}

/**
 * Gracefully disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
    console.log('✅ Redis disconnected gracefully');
  }
}

/**
 * Cache utility functions with fallback
 */
export const cache = {
  /**
   * Get a cached value
   * @returns Cached value or null if not found/unavailable
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return null;

    try {
      return await client.get(key);
    } catch (error) {
      console.error(`❌ Redis GET error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set a cached value with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be stringified)
   * @param ttlSeconds Time to live in seconds (default: 24 hours)
   */
  async set(key: string, value: string, ttlSeconds: number = 86400): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return false;

    try {
      await client.set(key, value, 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Set a cached value with expiration timestamp
   * @param key Cache key
   * @param value Value to cache
   * @param expiresAt Unix timestamp (milliseconds) when cache should expire
   */
  async setWithExpiry(key: string, value: string, expiresAt: number): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return false;

    try {
      await client.set(key, value, 'PXAT', expiresAt);
      return true;
    } catch (error) {
      console.error(`❌ Redis SETEX error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Delete a cached value
   * @param key Cache key to delete
   */
  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Check if a key exists
   * @param key Cache key to check
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Get time to live for a key (in seconds)
   * @param key Cache key
   * @returns TTL in seconds, or -1 if no expiry, -2 if key doesn't exist, null if Redis unavailable
   */
  async ttl(key: string): Promise<number | null> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return null;

    try {
      return await client.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Increment a counter
   * @param key Counter key
   * @param amount Amount to increment (default: 1)
   */
  async incr(key: string, amount: number = 1): Promise<number | null> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return null;

    try {
      if (amount === 1) {
        return await client.incr(key);
      } else {
        return await client.incrby(key, amount);
      }
    } catch (error) {
      console.error(`❌ Redis INCR error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Flush all cache keys (use with caution!)
   */
  async flush(): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) return false;

    try {
      await client.flushdb();
      console.log('🗑️  Redis cache flushed');
      return true;
    } catch (error) {
      console.error('❌ Redis FLUSH error:', error);
      return false;
    }
  },
};

/**
 * Generate a cache key for transforms
 * @param projectId Project ID
 * @param resolvedPath File path
 * @param options Transform options
 * @returns Cache key string
 */
export function generateTransformCacheKey(
  projectId: string,
  resolvedPath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: string;
  }
): string {
  const { width, height, quality, format, fit } = options;
  return `transform:${projectId}:${resolvedPath}:w${width || 'auto'}:h${height || 'auto'}:q${quality || 80}:f${format || 'auto'}:fit${fit || 'cover'}`;
}

/**
 * Cache metrics for monitoring
 */
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,

  recordHit() {
    this.hits++;
  },

  recordMiss() {
    this.misses++;
  },

  recordError() {
    this.errors++;
  },

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      total,
      hitRate: hitRate.toFixed(2) + '%',
    };
  },

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  },
};
