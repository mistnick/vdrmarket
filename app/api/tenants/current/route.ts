/**
 * Current Tenant Context API
 * GET /api/tenants/current - Get current tenant context
 * DELETE /api/tenants/current - Clear current tenant
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { 
  getTenantContext, 
  clearCurrentTenant,
  resolveTenantId,
  hasAccessToTenant,
} from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No tenant selected",
      });
    }

    // Check if user has access to the tenant in cookie
    const hasAccess = await hasAccessToTenant(session.userId, tenantId);
    if (!hasAccess) {
      // Clear invalid tenant cookie
      await clearCurrentTenant();
      console.log(`[TENANTS] Cleared invalid tenant cookie for user ${session.userId}`);
      return NextResponse.json({
        success: true,
        data: null,
        message: "No access to selected tenant - cookie cleared",
      });
    }

    const context = await getTenantContext();
    if (!context) {
      // Clear tenant cookie since context could not be built
      await clearCurrentTenant();
      return NextResponse.json({
        success: true,
        data: null,
        message: "No access to selected tenant",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: context.tenant.id,
          name: context.tenant.name,
          slug: context.tenant.slug,
          logo: context.tenant.logo,
          status: context.tenant.status,
        },
        role: context.tenantUser.role,
        plan: context.plan ? {
          id: context.plan.id,
          name: context.plan.name,
        } : null,
        features: context.features,
        usage: context.usage,
      },
    });
  } catch (error) {
    console.error("[TENANTS] Error getting current tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get current tenant" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await clearCurrentTenant();

    return NextResponse.json({
      success: true,
      message: "Tenant cleared successfully",
    });
  } catch (error) {
    console.error("[TENANTS] Error clearing current tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear current tenant" },
      { status: 500 }
    );
  }
}
