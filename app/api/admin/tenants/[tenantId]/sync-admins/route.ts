/**
 * Sync Tenant Admins to Admin Groups API
 * POST /api/admin/tenants/[tenantId]/sync-admins
 * Ensures all TENANT_ADMIN users are members of ADMINISTRATOR groups
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/tenant";
import { syncTenantAdminsToGroups } from "@/lib/tenant";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { tenantId } = await params;

  try {
    const result = await syncTenantAdminsToGroups(tenantId);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Synced ${result.usersProcessed} admins, added ${result.groupsUpdated} group memberships`,
    });
  } catch (error) {
    console.error("[ADMIN] Error syncing tenant admins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync tenant admins" },
      { status: 500 }
    );
  }
}
