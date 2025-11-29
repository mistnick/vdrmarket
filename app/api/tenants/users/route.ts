/**
 * Tenant Users Management API (for Tenant Admins)
 * GET /api/tenants/users - List users in current tenant
 * POST /api/tenants/users - Add user to current tenant
 */

import { NextResponse } from "next/server";
import { 
  requireTenantAdmin,
  listTenantUsers,
  addUserToTenant,
} from "@/lib/tenant";
import type { InviteTenantUserInput, TenantContext } from "@/lib/tenant";

export async function GET() {
  const result = await requireTenantAdmin();
  if (result instanceof NextResponse) {
    return result;
  }

  const context = result as TenantContext;

  try {
    const users = await listTenantUsers(context.tenant.id);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("[TENANT] Error listing users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const result = await requireTenantAdmin();
  if (result instanceof NextResponse) {
    return result;
  }

  const context = result as TenantContext;

  try {
    const body = await request.json();
    
    const input: InviteTenantUserInput = {
      email: body.email,
      role: body.role || "MEMBER",
      sendEmail: body.sendEmail ?? true,
    };

    if (!input.email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const tenantUser = await addUserToTenant(
      context.tenant.id, 
      input, 
      context.tenantUser.userId
    );

    return NextResponse.json({
      success: true,
      data: tenantUser,
    }, { status: 201 });
  } catch (error) {
    console.error("[TENANT] Error adding user:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add user" },
      { status: 500 }
    );
  }
}
