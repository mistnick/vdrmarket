import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { structuredLog } from "@/lib/logger";

/**
 * Global error handler wrapper for API routes
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      structuredLog.error("API Error", error as Error, {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      // Report to Sentry
      Sentry.captureException(error, {
        contexts: {
          request: {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
          },
        },
      });

      // Return error response
      return NextResponse.json(
        {
          error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : errorMessage,
          ...(process.env.NODE_ENV === "development" && {
            stack: errorStack,
          }),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  operationName: string
) {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();

    return await Sentry.startSpan(
      {
        op: "http.server",
        name: operationName,
      },
      async () => {
        try {
          const response = await handler(request, context);
          const duration = Date.now() - startTime;

          structuredLog.http(`${request.method} ${request.nextUrl.pathname}`, {
            duration,
            status: response.status,
          });

          return response;
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  };
}

/**
 * Request logging middleware
 */
export function logRequest(request: NextRequest) {
  structuredLog.http(`${request.method} ${request.nextUrl.pathname}`, {
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
  });
}
