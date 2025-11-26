import Redis from "ioredis";

let redis: Redis | null = null;
const inMemoryCache = new Map<string, { value: any; expiry: number | null }>();

// Initialize Redis client
if (process.env.REDIS_URL) {
    try {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            lazyConnect: true,
        });

        redis.on("error", (err) => {
            console.error("Redis connection error:", err);
            redis = null;
        });

        redis.on("connect", () => {
            console.log("✅ Redis connected successfully");
        });

        // Connect immediately
        redis.connect().catch((err) => {
            console.error("Failed to connect to Redis:", err);
            redis = null;
        });
    } catch (error) {
        console.error("Error initializing Redis:", error);
        redis = null;
    }
}

// Get value from cache
export async function getCacheValue<T>(key: string): Promise<T | null> {
    try {
        if (redis) {
            const value = await redis.get(key);
            if (value) {
                return JSON.parse(value) as T;
            }
            return null;
        } else {
            // Fallback to in-memory cache
            const cached = inMemoryCache.get(key);
            if (cached) {
                if (cached.expiry && Date.now() > cached.expiry) {
                    inMemoryCache.delete(key);
                    return null;
                }
                return cached.value as T;
            }
            return null;
        }
    } catch (error) {
        console.error("Error getting cache value:", error);
        return null;
    }
}

// Set value in cache with optional TTL (seconds)
export async function setCacheValue(
    key: string,
    value: any,
    ttl?: number
): Promise<boolean> {
    try {
        const serialized = JSON.stringify(value);

        if (redis) {
            if (ttl) {
                await redis.setex(key, ttl, serialized);
            } else {
                await redis.set(key, serialized);
            }
            return true;
        } else {
            // Fallback to in-memory cache
            inMemoryCache.set(key, {
                value,
                expiry: ttl ? Date.now() + ttl * 1000 : null,
            });
            return true;
        }
    } catch (error) {
        console.error("Error setting cache value:", error);
        return false;
    }
}

// Delete value from cache
export async function deleteCacheValue(key: string): Promise<boolean> {
    try {
        if (redis) {
            await redis.del(key);
            return true;
        } else {
            return inMemoryCache.delete(key);
        }
    } catch (error) {
        console.error("Error deleting cache value:", error);
        return false;
    }
}

// Delete multiple keys (pattern matching for Redis, prefix for in-memory)
export async function deleteCachePattern(pattern: string): Promise<number> {
    try {
        if (redis) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                return keys.length;
            }
            return 0;
        } else {
            // In-memory: delete keys starting with pattern (simple prefix match)
            let count = 0;
            const prefix = pattern.replace("*", "");
            for (const key of inMemoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    inMemoryCache.delete(key);
                    count++;
                }
            }
            return count;
        }
    } catch (error) {
        console.error("Error deleting cache pattern:", error);
        return 0;
    }
}

// Check if key exists
export async function cacheExists(key: string): Promise<boolean> {
    try {
        if (redis) {
            const exists = await redis.exists(key);
            return exists === 1;
        } else {
            return inMemoryCache.has(key);
        }
    } catch (error) {
        console.error("Error checking cache existence:", error);
        return false;
    }
}

// Get remaining TTL for a key (seconds, -1 if no expiry, -2 if not exists)
export async function getCacheTTL(key: string): Promise<number> {
    try {
        if (redis) {
            return await redis.ttl(key);
        } else {
            const cached = inMemoryCache.get(key);
            if (!cached) return -2;
            if (!cached.expiry) return -1;
            const remaining = Math.floor((cached.expiry - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2;
        }
    } catch (error) {
        console.error("Error getting cache TTL:", error);
        return -2;
    }
}

// Increment counter (atomic)
export async function incrementCache(key: string, amount: number = 1): Promise<number> {
    try {
        if (redis) {
            return await redis.incrby(key, amount);
        } else {
            const current = inMemoryCache.get(key);
            const newValue = (current?.value || 0) + amount;
            inMemoryCache.set(key, { value: newValue, expiry: current?.expiry || null });
            return newValue;
        }
    } catch (error) {
        console.error("Error incrementing cache:", error);
        return 0;
    }
}

// Flush all cache
export async function flushCache(): Promise<boolean> {
    try {
        if (redis) {
            await redis.flushdb();
            return true;
        } else {
            inMemoryCache.clear();
            return true;
        }
    } catch (error) {
        console.error("Error flushing cache:", error);
        return false;
    }
}

// Get Redis client for advanced operations
export function getRedisClient(): Redis | null {
    return redis;
}

// Cache key generators for consistency
export const CacheKeys = {
    user: (userId: string) => `user:${userId}`,
    document: (documentId: string) => `document:${documentId}`,
    documentList: (teamId: string, folderId?: string) =>
        `documents:${teamId}${folderId ? `:${folderId}` : ""}`,
    permissions: (userId: string, resourceId: string) =>
        `permissions:${userId}:${resourceId}`,
    tags: (teamId: string) => `tags:${teamId}`,
    metadata: (documentId: string) => `metadata:${documentId}`,
    notifications: (userId: string) => `notifications:${userId}`,
    unreadCount: (userId: string) => `notifications:unread:${userId}`,
};
