import { Redis } from "@upstash/redis";

// In-memory fallback cache when Upstash Redis credentials are not configured
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes("[YOUR-REDIS-URL]")) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export const cache = {
  /**
   * Retrieves a cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (redis) {
      try {
        return await redis.get<T>(key);
      } catch (err: any) {
        console.warn(`[Cache] Redis GET failed (${err.message}), falling back to memory.`);
      }
    }

    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  },

  /**
   * Stores a value in cache with a TTL in seconds (default: 86400 = 24 hours)
   */
  async set(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(key, value, { ex: ttlSeconds });
        return;
      } catch (err: any) {
        console.warn(`[Cache] Redis SET failed (${err.message}), falling back to memory.`);
      }
    }

    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Checks if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  },

  /**
   * Deletes a key from cache
   */
  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(key);
      } catch (err) {}
    }
    memoryCache.delete(key);
  },
};
