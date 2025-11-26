/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for API endpoints
 * For production, use Redis
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

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

  async check(limit: number, token: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const tokenKey = `${token}`;

    const record = rateLimitMap.get(tokenKey);

    if (!record || now > record.resetTime) {
      // Create or reset the record
      rateLimitMap.set(tokenKey, {
        count: 1,
        resetTime: now + this.interval,
      });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + this.interval,
      };
    }

    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count++;

    return {
      success: true,
      limit,
      remaining: limit - record.count,
      reset: record.resetTime,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// Default rate limiters
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const authLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

export const uploadLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 50,
});

// Cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    apiLimiter.cleanup();
    authLimiter.cleanup();
    uploadLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

/**
 * Rate limit middleware helper
 */
export async function rateLimit(
  request: Request,
  limiter: RateLimiter = apiLimiter,
  limit: number = 100
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const ip = getClientIp(request);
  return limiter.check(limit, ip);
}
