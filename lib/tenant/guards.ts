/**
 * Tenant Middleware Guards
 * Protects routes and validates tenant access
 * Version: 4.0.0
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { 
  resolveTenantId, 
  validateTenant, 
  hasAccessToTenant,
  isTenantAdmin,
  getTenantContext,
} from "./context";
import type { TenantContext } from "./types";

/**
 * Require authenticated user
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return session;
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isSuperAdmin: true },
  });

  if (!user?.isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super admin access required" },
      { status: 403 }
    );
  }

  return session;
}

/**
 * Require tenant context
 * Returns tenant context or error response
 */
export async function requireTenantContext(): Promise<TenantContext | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const context = await getTenantContext();
  if (!context) {
    return NextResponse.json(
      { success: false, error: "No tenant selected or access denied" },
      { status: 403 }
    );
  }

  // Validate tenant is active
  const validation = await validateTenant(context.tenant.id);
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: validation.errors.join(", ") },
      { status: 403 }
    );
  }

  return context;
}

/**
 * Require tenant admin role
 */
export async function requireTenantAdmin(): Promise<TenantContext | NextResponse> {
  const result = await requireTenantContext();
  if (result instanceof NextResponse) {
    return result;
  }

  if (result.tenantUser.role !== "TENANT_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Tenant admin access required" },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Require access to specific tenant
 */
export async function requireTenantAccess(tenantId: string) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Super admins can access any tenant
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { session, isSuperAdmin: true };
  }

  // Check tenant user access
  const hasAccess = await hasAccessToTenant(session.userId, tenantId);
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: "Access denied to this tenant" },
      { status: 403 }
    );
  }

  // Validate tenant
  const validation = await validateTenant(tenantId);
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: validation.errors.join(", ") },
      { status: 403 }
    );
  }

  return { session, isSuperAdmin: false };
}

/**
 * Middleware function for Next.js middleware.ts
 * Checks tenant access for protected routes
 */
export async function tenantMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip tenant check for admin routes (super admin area)
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Skip tenant check for auth routes
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    return null;
  }

  // Skip tenant check for public routes
  if (pathname.startsWith("/api/public") || pathname.startsWith("/view")) {
    return null;
  }

  // For protected routes, resolve tenant
  const tenantId = await resolveTenantId();
  
  // If accessing tenant-specific routes without tenant context
  // The client-side TenantProvider will auto-select the first available tenant
  // No redirect needed

  return null;
}

/**
 * Helper to extract tenant ID from request params
 */
export function getTenantIdFromParams(params: { tenantId?: string }): string | null {
  return params.tenantId || null;
}

/**
 * Helper to wrap API handler with tenant context
 */
export function withTenantContext<T>(
  handler: (context: TenantContext, ...args: T[]) => Promise<NextResponse>
) {
  return async (...args: T[]): Promise<NextResponse> => {
    const context = await requireTenantContext();
    if (context instanceof NextResponse) {
      return context;
    }
    return handler(context, ...args);
  };
}

/**
 * Helper to wrap API handler with tenant admin context
 */
export function withTenantAdmin<T>(
  handler: (context: TenantContext, ...args: T[]) => Promise<NextResponse>
) {
  return async (...args: T[]): Promise<NextResponse> => {
    const context = await requireTenantAdmin();
    if (context instanceof NextResponse) {
      return context;
    }
    return handler(context, ...args);
  };
}

/**
 * Helper to wrap API handler with super admin check
 */
export function withSuperAdmin<T>(
  handler: (session: { userId: string; email: string }, ...args: T[]) => Promise<NextResponse>
) {
  return async (...args: T[]): Promise<NextResponse> => {
    const result = await requireSuperAdmin();
    if (result instanceof NextResponse) {
      return result;
    }
    return handler(result, ...args);
  };
}
