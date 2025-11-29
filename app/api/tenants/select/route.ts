/**
 * Select Current Tenant API
 * POST /api/tenants/select - Set current tenant in session
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { 
  setCurrentTenant, 
  hasAccessToTenant, 
  validateTenant 
} from "@/lib/tenant";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const hasAccess = await hasAccessToTenant(session.userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied to this tenant" },
        { status: 403 }
      );
    }

    // Verify tenant is active
    const validation = await validateTenant(tenantId);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 403 }
      );
    }

    // Set tenant in cookie
    await setCurrentTenant(tenantId);

    return NextResponse.json({
      success: true,
      message: "Tenant selected successfully",
    });
  } catch (error) {
    console.error("[TENANTS] Error selecting tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to select tenant" },
      { status: 500 }
    );
  }
}
