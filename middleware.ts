/**
 * Authentication & Multi-Tenant Middleware
 * Handles authentication and tenant context for all routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfigEdge } from "@/lib/auth/auth.config.edge";

const { auth } = NextAuth(authConfigEdge);

const SESSION_COOKIE_NAME = "dataroom-session";

// Route pubbliche che non richiedono autenticazione
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/error",
  "/auth/callback",
  "/api/auth",
  "/api/upload", // Upload route handles auth internally (Pages Router)
  "/view",
  "/api/public",
  "/pricing",
];

// Route di autenticazione che reindirizzano se già autenticati
const authRoutes = ["/auth/login", "/auth/signup"];

// Super Admin routes
const superAdminRoutes = ["/admin", "/api/admin"];

// Routes that require tenant context
const tenantRequiredRoutes = [
  "/dashboard",
  "/datarooms",
  "/documents",
  "/settings",
  "/api/datarooms",
  "/api/documents",
  "/api/folders",
  "/api/links",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + "/")
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route));
}

function isSuperAdminRoute(pathname: string): boolean {
  return superAdminRoutes.some((route) => pathname.startsWith(route));
}

function isTenantRequiredRoute(pathname: string): boolean {
  return tenantRequiredRoutes.some((route) => pathname.startsWith(route));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Check for custom session cookie first (our database-backed session)
  const customSessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  // Also check NextAuth session as fallback
  const nextAuthSession = await auth();
  
  // User is authenticated if they have either session type
  const isAuthenticated = !!customSessionToken || !!nextAuthSession;

  // If authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Super admin routes - check isSuperAdmin flag
  // Note: Full super admin check is done in API routes since we can't
  // access database directly in Edge middleware
  if (isSuperAdminRoute(pathname)) {
    // Basic check passes, detailed check in API routes
    return response;
  }

  // For tenant-required routes, check if tenant is selected
  if (isTenantRequiredRoute(pathname)) {
    const currentTenantId = req.cookies.get("current-tenant")?.value;
    
    // If no tenant selected, the TenantProvider will auto-select the first available tenant
    // No redirect needed - the client-side hook handles this
  }

  // API routes for tenant management don't need tenant context
  if (pathname === "/api/tenants" || pathname === "/api/tenants/select" || pathname === "/api/tenants/current") {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files (.svg, .png, .jpg, etc.)
     * - api/upload (large file uploads handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
