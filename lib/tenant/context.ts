/**
 * Tenant Context Management
 * Handles current tenant resolution and validation
 * Version: 4.0.0
 */

import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import type { 
  TenantContext, 
  TenantUsage, 
  PlanFeatures,
  TenantValidation 
} from "./types";

const TENANT_COOKIE_NAME = "current-tenant";
const TENANT_HEADER_NAME = "x-tenant-id";

/**
 * Resolve tenant from request
 * Priority: 1. Header, 2. Cookie, 3. Subdomain
 */
export async function resolveTenantId(): Promise<string | null> {
  try {
    // 1. Check header (for API calls)
    const headersList = await headers();
    const headerTenantId = headersList.get(TENANT_HEADER_NAME);
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. Check cookie (for web app)
    const cookieStore = await cookies();
    const cookieTenantId = cookieStore.get(TENANT_COOKIE_NAME)?.value;
    if (cookieTenantId) {
      return cookieTenantId;
    }

    // 3. Check subdomain
    const host = headersList.get("host");
    if (host) {
      const subdomain = extractSubdomain(host);
      if (subdomain && subdomain !== "www" && subdomain !== "app") {
        // Look up tenant by slug
        const tenant = await prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: subdomain },
              { customDomain: host }
            ],
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { id: true },
        });
        if (tenant) {
          return tenant.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[TENANT] Error resolving tenant:", error);
    return null;
  }
}

/**
 * Extract subdomain from host
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  
  // localhost or IP address
  if (parts.length <= 1 || hostWithoutPort === "localhost") {
    return null;
  }
  
  // subdomain.domain.tld or subdomain.domain.co.uk etc
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

/**
 * Set current tenant in cookie
 */
export async function setCurrentTenant(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE_NAME, tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear current tenant from cookie
 */
export async function clearCurrentTenant(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_COOKIE_NAME);
}

/**
 * Validate tenant is active and not expired
 */
export async function validateTenant(tenantId: string): Promise<TenantValidation> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return {
      isValid: false,
      isActive: false,
      isExpired: false,
      isSuspended: false,
      errors: ["Tenant not found"],
    };
  }

  const errors: string[] = [];
  const isActive = tenant.status === "ACTIVE";
  const isExpired = tenant.endDate ? new Date() > tenant.endDate : false;
  const isSuspended = tenant.status === "SUSPENDED";
  const isDeleted = tenant.deletedAt !== null;

  if (!isActive) {
    errors.push(`Tenant is ${tenant.status.toLowerCase()}`);
  }
  if (isExpired) {
    errors.push("Tenant subscription has expired");
  }
  if (isDeleted) {
    errors.push("Tenant has been deleted");
  }

  return {
    isValid: isActive && !isExpired && !isDeleted,
    isActive,
    isExpired,
    isSuspended,
    errors,
  };
}

/**
 * Get full tenant context for current request
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return null;
  }

  // Get tenant with plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant || tenant.deletedAt) {
    return null;
  }

  // Get tenant user membership
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: session.userId,
      },
    },
  });

  if (!tenantUser || tenantUser.status !== "ACTIVE") {
    return null;
  }

  // Parse features
  const features = (tenant.plan?.features as PlanFeatures) || {};

  // Calculate usage
  const usage = await calculateTenantUsage(tenantId, tenant.plan);

  return {
    tenant,
    tenantUser,
    plan: tenant.plan,
    features,
    usage,
  };
}

/**
 * Calculate tenant usage statistics
 */
export async function calculateTenantUsage(
  tenantId: string,
  plan: { maxVdr: number; maxAdminUsers: number; maxStorageMb: number } | null
): Promise<TenantUsage> {
  const [vdrCount, userCounts, tenant] = await Promise.all([
    prisma.dataRoom.count({
      where: { tenantId, archivedAt: null },
    }),
    prisma.tenantUser.groupBy({
      by: ["role"],
      where: { tenantId, status: "ACTIVE" },
      _count: true,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { storageUsedMb: true, endDate: true },
    }),
  ]);

  const adminUserCount = userCounts.find(u => u.role === "TENANT_ADMIN")?._count || 0;
  const totalUserCount = userCounts.reduce((sum, u) => sum + u._count, 0);

  const daysRemaining = tenant?.endDate
    ? Math.max(0, Math.ceil((tenant.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    tenantId,
    vdrCount,
    maxVdr: plan?.maxVdr ?? 1,
    adminUserCount,
    maxAdminUsers: plan?.maxAdminUsers ?? 3,
    totalUserCount,
    storageUsedMb: tenant?.storageUsedMb ?? 0,
    maxStorageMb: plan?.maxStorageMb ?? 1024,
    daysRemaining,
  };
}

/**
 * Check if tenant can create more VDRs
 */
export async function canCreateVdr(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant?.plan) {
    return { allowed: false, reason: "No plan assigned" };
  }

  if (tenant.plan.maxVdr === -1) {
    return { allowed: true }; // Unlimited
  }

  const vdrCount = await prisma.dataRoom.count({
    where: { tenantId, archivedAt: null },
  });

  if (vdrCount >= tenant.plan.maxVdr) {
    return { 
      allowed: false, 
      reason: `VDR limit reached (${vdrCount}/${tenant.plan.maxVdr})` 
    };
  }

  return { allowed: true };
}

/**
 * Check if tenant can add more admin users
 */
export async function canAddAdminUser(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant?.plan) {
    return { allowed: false, reason: "No plan assigned" };
  }

  if (tenant.plan.maxAdminUsers === -1) {
    return { allowed: true }; // Unlimited
  }

  const adminCount = await prisma.tenantUser.count({
    where: { 
      tenantId, 
      role: "TENANT_ADMIN",
      status: "ACTIVE",
    },
  });

  if (adminCount >= tenant.plan.maxAdminUsers) {
    return { 
      allowed: false, 
      reason: `Admin user limit reached (${adminCount}/${tenant.plan.maxAdminUsers})` 
    };
  }

  return { allowed: true };
}

/**
 * Check if tenant has storage capacity
 */
export async function canUseStorage(
  tenantId: string, 
  additionalMb: number
): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant?.plan) {
    return { allowed: false, reason: "No plan assigned" };
  }

  if (tenant.plan.maxStorageMb === -1) {
    return { allowed: true }; // Unlimited
  }

  const newUsage = tenant.storageUsedMb + additionalMb;
  if (newUsage > tenant.plan.maxStorageMb) {
    return { 
      allowed: false, 
      reason: `Storage limit would be exceeded (${tenant.storageUsedMb}MB + ${additionalMb}MB > ${tenant.plan.maxStorageMb}MB)` 
    };
  }

  return { allowed: true };
}

/**
 * Get user's tenants
 */
export async function getUserTenants(userId: string) {
  return prisma.tenantUser.findMany({
    where: {
      userId,
      status: "ACTIVE",
      tenant: {
        status: "ACTIVE",
        deletedAt: null,
      },
    },
    include: {
      tenant: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: {
      tenant: {
        name: "asc",
      },
    },
  });
}

/**
 * Check if user has access to tenant
 */
export async function hasAccessToTenant(
  userId: string, 
  tenantId: string
): Promise<boolean> {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  return tenantUser?.status === "ACTIVE";
}

/**
 * Check if user is tenant admin
 */
export async function isTenantAdmin(
  userId: string, 
  tenantId: string
): Promise<boolean> {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  return tenantUser?.role === "TENANT_ADMIN" && tenantUser?.status === "ACTIVE";
}
