import { NextRequest } from "next/server";
import { getRedisClientSafe } from "./redis/client";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

export class RateLimiter {
  private interval: number;
  private uniqueTokenPerInterval: number;

  constructor(config: RateLimitConfig) {
    this.interval = config.interval;
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval;
  }

  async check(
    limit: number,
    token: string
  ): Promise<RateLimitResult> {
    const redis = getRedisClientSafe();

    // Use Redis if available, otherwise fallback to memory
    if (redis) {
      return this.checkWithRedis(limit, token, redis);
    } else {
      return this.checkWithMemory(limit, token);
    }
  }

  private async checkWithRedis(
    limit: number,
    token: string,
    redis: any
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${token}`;
    const now = Date.now();
    const windowStart = now - this.interval;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await redis.zcard(key);

      if (count >= limit) {
        // Get oldest entry to calculate reset time
        const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
        const resetAt =
          oldest.length > 0
            ? parseInt(oldest[1]) + this.interval
            : now + this.interval;

        return {
          success: false,
          limit,
          remaining: 0,
          reset: resetAt,
        };
      }

      // Add current request
      await redis.zadd(key, now, `${now}:${Math.random()}`);
      await redis.pexpire(key, this.interval);

      return {
        success: true,
        limit,
        remaining: limit - count - 1,
        reset: now + this.interval,
      };
    } catch (error) {
      console.error("Redis rate limit error:", error);
      // Fallback to memory on Redis error
      return this.checkWithMemory(limit, token);
    }
  }

  private checkWithMemory(limit: number, token: string): RateLimitResult {
    const key = `rate_limit:${token}`;
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      const resetAt = now + this.interval;
      memoryStore.set(key, { count: 1, resetAt });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetAt,
      };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    memoryStore.set(key, entry);

    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: entry.resetAt,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    }
  }
}

// Predefined limiters
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

export const authLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5,
});

export const uploadLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
});

// Cleanup every 5 minutes
setInterval(() => {
  apiLimiter.cleanup();
  authLimiter.cleanup();
  uploadLimiter.cleanup();
}, 5 * 60 * 1000);

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export async function rateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  perMinute: number = 100
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const identifier = `${ip}:${request.nextUrl.pathname}`;

  return limiter.check(perMinute, identifier);
}
