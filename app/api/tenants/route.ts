/**
 * Tenant Selection API
 * GET /api/tenants - List user's tenants
 * POST /api/tenants/select - Select current tenant
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserTenants, setCurrentTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const tenantMemberships = await getUserTenants(session.userId);

    // Map to simpler format
    const tenants = tenantMemberships.map(tm => ({
      id: tm.tenant.id,
      name: tm.tenant.name,
      slug: tm.tenant.slug,
      logo: tm.tenant.logo,
      role: tm.role,
      plan: tm.tenant.plan ? {
        id: tm.tenant.plan.id,
        name: tm.tenant.plan.name,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error("[TENANTS] Error listing user tenants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list tenants" },
      { status: 500 }
    );
  }
}
