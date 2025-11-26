# Monitoring & Logging

## Sentry Setup

DataRoom uses Sentry for error tracking and performance monitoring.

### Configuration

Set the following environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### Usage

Errors are automatically captured in:
- Client-side (browser)
- Server-side (API routes)
- Edge runtime

Manual error reporting:
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: "user-management"
    },
    extra: {
      userId: "123"
    }
  });
}
```

### Performance Monitoring

Transactions are automatically created for API routes using the `withPerformanceMonitoring` wrapper:

```typescript
import { withPerformanceMonitoring } from "@/lib/error-handler";

export const GET = withPerformanceMonitoring(
  async (request) => {
    // Your handler
  },
  "GET /api/documents"
);
```

## Structured Logging

DataRoom uses Winston for structured logging.

### Usage

```typescript
import { structuredLog } from "@/lib/logger";

// Info logging
structuredLog.info("User logged in", { userId: "123", email: "user@example.com" });

// Error logging
structuredLog.error("Failed to create document", error, {
  userId: "123",
  documentId: "456"
});

// Warning
structuredLog.warn("High memory usage", { usage: "85%" });

// Debug
structuredLog.debug("Processing request", { requestId: "abc" });

// HTTP request logging
structuredLog.http("GET /api/documents", {
  duration: 245,
  status: 200
});
```

### Log Files

In production, logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Log Levels

- `error`: Error events
- `warn`: Warning messages
- `info`: Informational messages
- `http`: HTTP requests
- `debug`: Debug messages (development only)

## Error Handling

Use the error handling wrapper for API routes:

```typescript
import { withErrorHandling } from "@/lib/error-handler";

export const GET = withErrorHandling(async (request) => {
  // Your handler code
  // Errors are automatically caught, logged, and reported to Sentry
});
```

## Best Practices

1. **Always use structured logging** - Include relevant context (userId, documentId, etc.)
2. **Log at appropriate levels** - Don't log everything as error
3. **Include request context** - Add request IDs for tracing
4. **Monitor performance** - Use transaction monitoring for slow operations
5. **Review Sentry regularly** - Set up alerts for critical errors
6. **Sanitize sensitive data** - Don't log passwords, tokens, etc.

## Metrics

Key metrics to monitor:
- API response times
- Error rates
- Database query performance
- Cache hit rates
- Storage operations
- Authentication failures

## Alerts

Configure Sentry alerts for:
- Error rate threshold
- Performance degradation
- New error types
- Release issues
