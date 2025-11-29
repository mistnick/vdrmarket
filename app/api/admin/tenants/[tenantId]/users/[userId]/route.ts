/**
 * Super Admin - Single Tenant User API
 * PUT /api/admin/tenants/[tenantId]/users/[userId] - Update tenant user
 * DELETE /api/admin/tenants/[tenantId]/users/[userId] - Remove user from tenant
 */

import { NextResponse } from "next/server";
import { 
  requireSuperAdmin, 
  updateTenantUser, 
  removeUserFromTenant,
} from "@/lib/tenant";
import type { UpdateTenantUserInput } from "@/lib/tenant";

interface RouteParams {
  params: Promise<{ tenantId: string; userId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { tenantId, userId } = await params;
    const body = await request.json();
    
    const input: UpdateTenantUserInput = {
      role: body.role,
      status: body.status,
    };

    // Remove undefined values
    Object.keys(input).forEach(key => {
      if (input[key as keyof UpdateTenantUserInput] === undefined) {
        delete input[key as keyof UpdateTenantUserInput];
      }
    });

    const tenantUser = await updateTenantUser(
      tenantId, 
      userId, 
      input, 
      authResult.userId
    );

    return NextResponse.json({
      success: true,
      data: tenantUser,
    });
  } catch (error) {
    console.error("[ADMIN] Error updating tenant user:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update tenant user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { tenantId, userId } = await params;
    
    await removeUserFromTenant(tenantId, userId, authResult.userId);

    return NextResponse.json({
      success: true,
      message: "User removed from tenant",
    });
  } catch (error) {
    console.error("[ADMIN] Error removing user from tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove user from tenant" },
      { status: 500 }
    );
  }
}
