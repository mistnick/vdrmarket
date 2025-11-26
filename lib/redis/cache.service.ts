import { getRedisClientSafe } from "./client";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const DEFAULT_TTL = 3600; // 1 hour
const DEFAULT_PREFIX = "cache:";

export class CacheService {
  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    const redis = getRedisClientSafe();
    if (!redis) return null;

    try {
      const prefix = options?.prefix || DEFAULT_PREFIX;
      const fullKey = `${prefix}${key}`;
      const value = await redis.get(fullKey);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    const redis = getRedisClientSafe();
    if (!redis) return false;

    try {
      const prefix = options?.prefix || DEFAULT_PREFIX;
      const ttl = options?.ttl || DEFAULT_TTL;
      const fullKey = `${prefix}${key}`;
      const serialized = JSON.stringify(value);

      await redis.setex(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    const redis = getRedisClientSafe();
    if (!redis) return false;

    try {
      const prefix = options?.prefix || DEFAULT_PREFIX;
      const fullKey = `${prefix}${key}`;
      await redis.del(fullKey);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    const redis = getRedisClientSafe();
    if (!redis) return 0;

    try {
      const prefix = options?.prefix || DEFAULT_PREFIX;
      const fullPattern = `${prefix}${pattern}`;
      const keys = await redis.keys(fullPattern);

      if (keys.length === 0) return 0;

      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error("Cache delete pattern error:", error);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const redis = getRedisClientSafe();
    if (!redis) return false;

    try {
      const prefix = options?.prefix || DEFAULT_PREFIX;
      const fullKey = `${prefix}${key}`;
      const result = await redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Get or set a value (fetch from source if not cached)
   */
  async getOrSet<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T | null> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    try {
      const value = await fetchFn();
      if (value !== null && value !== undefined) {
        await this.set(key, value, options);
      }
      return value;
    } catch (error) {
      console.error("Cache getOrSet fetch error:", error);
      return null;
    }
  }
}

export const cacheService = new CacheService();
