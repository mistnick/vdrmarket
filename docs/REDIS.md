# Redis Configuration

This project uses Redis for distributed caching and rate limiting.

## Local Development

Redis is included in the Docker Compose setup:

```bash
docker-compose up -d redis
```

The Redis instance will be available at `localhost:6379`.

## Environment Variables

Add to your `.env` file:

```bash
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # Optional, for production
```

## Usage

### Caching

The cache service provides a simple interface for caching data:

```typescript
import { CacheService } from "@/lib/redis/cache.service";

const cache = new CacheService();

// Get from cache
const value = await cache.get<MyType>("my-key");

// Set in cache with TTL
await cache.set("my-key", myData, { ttl: 3600 }); // 1 hour

// Cache-aside pattern
const data = await cache.getOrSet(
  "my-key",
  async () => {
    // Fetch data from database if not in cache
    return await fetchFromDatabase();
  },
  { ttl: 3600 }
);

// Delete from cache
await cache.delete("my-key");

// Delete pattern
await cache.deletePattern("user:*");
```

### Rate Limiting

Rate limiting is implemented with Redis primary and in-memory fallback:

```typescript
import { RateLimiter } from "@/lib/rate-limit-redis";

// Check rate limit
const result = await RateLimiter.check("user-123", "api");

if (!result.allowed) {
  return NextResponse.json(
    { error: "Too many requests" },
    { 
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      }
    }
  );
}
```

Predefined rate limiters:
- `api`: 100 requests per minute
- `auth`: 5 requests per minute
- `upload`: 10 requests per minute

## Production Setup

For production, use a managed Redis service like:
- **AWS ElastiCache for Redis**
- **Azure Cache for Redis**
- **Google Cloud Memorystore**
- **Redis Cloud**

Update the `REDIS_URL` environment variable with your production Redis connection string:

```bash
REDIS_URL="rediss://username:password@your-redis-host:6380"
```

## Monitoring

Monitor Redis health:
- Memory usage
- Hit rate
- Key count
- Connection errors

Use Redis CLI for debugging:

```bash
# Connect to Redis
docker exec -it dataroom-redis redis-cli

# Monitor commands
MONITOR

# Get info
INFO

# Check keys
KEYS *

# Get key TTL
TTL my-key
```

## Fallback Behavior

If Redis is unavailable:
- Cache operations return `null` gracefully
- Rate limiter falls back to in-memory storage
- Application continues to function (degraded mode)

## Best Practices

1. **Set appropriate TTLs** - Don't cache data forever
2. **Use key prefixes** - Organize keys by feature/entity
3. **Monitor memory usage** - Set maxmemory policy
4. **Use pipelining** - Batch multiple operations
5. **Handle failures gracefully** - Always have fallback logic
6. **Avoid hot keys** - Distribute load across keys
7. **Use connection pooling** - Reuse connections

## Key Naming Convention

Follow a consistent naming pattern:

```
{feature}:{entity}:{id}:{attribute}
```

Examples:
- `user:123:profile`
- `document:abc:views`
- `team:xyz:members`
- `session:token:def456`
