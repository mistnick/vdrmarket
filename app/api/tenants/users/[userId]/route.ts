/**
 * Tenant User Management API (for Tenant Admins)
 * PUT /api/tenants/users/[userId] - Update user in current tenant
 * DELETE /api/tenants/users/[userId] - Remove user from current tenant
 */

import { NextResponse } from "next/server";
import { 
  requireTenantAdmin,
  updateTenantUser,
  removeUserFromTenant,
} from "@/lib/tenant";
import type { UpdateTenantUserInput, TenantContext } from "@/lib/tenant";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const result = await requireTenantAdmin();
  if (result instanceof NextResponse) {
    return result;
  }

  const context = result as TenantContext;

  try {
    const { userId } = await params;
    const body = await request.json();
    
    // Prevent self-demotion
    if (userId === context.tenantUser.userId && body.role !== "TENANT_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const input: UpdateTenantUserInput = {
      role: body.role,
      status: body.status,
    };

    const tenantUser = await updateTenantUser(
      context.tenant.id,
      userId,
      input,
      context.tenantUser.userId
    );

    return NextResponse.json({
      success: true,
      data: tenantUser,
    });
  } catch (error) {
    console.error("[TENANT] Error updating user:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const result = await requireTenantAdmin();
  if (result instanceof NextResponse) {
    return result;
  }

  const context = result as TenantContext;

  try {
    const { userId } = await params;
    
    // Prevent self-removal
    if (userId === context.tenantUser.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot remove yourself from the tenant" },
        { status: 400 }
      );
    }

    await removeUserFromTenant(
      context.tenant.id,
      userId,
      context.tenantUser.userId
    );

    return NextResponse.json({
      success: true,
      message: "User removed from tenant",
    });
  } catch (error) {
    console.error("[TENANT] Error removing user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove user" },
      { status: 500 }
    );
  }
}
