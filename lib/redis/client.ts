import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379");
  const redisPassword = process.env.REDIS_PASSWORD;

  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  } else {
    redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }

  redis.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });

  return redis;
}

export function getRedisClientSafe(): Redis | null {
  try {
    return getRedisClient();
  } catch (error) {
    console.error("Failed to get Redis client:", error);
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
