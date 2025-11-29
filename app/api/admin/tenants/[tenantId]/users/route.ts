/**
 * Super Admin - Tenant Users Management API
 * GET /api/admin/tenants/[tenantId]/users - List tenant users
 * POST /api/admin/tenants/[tenantId]/users - Add user to tenant
 */

import { NextResponse } from "next/server";
import { 
  requireSuperAdmin, 
  listTenantUsers, 
  addUserToTenant,
} from "@/lib/tenant";
import type { InviteTenantUserInput } from "@/lib/tenant";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { tenantId } = await params;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status") as "ACTIVE" | "INACTIVE" | "PENDING" | undefined;
    const role = searchParams.get("role") as "TENANT_ADMIN" | "MEMBER" | "VIEWER" | undefined;

    const users = await listTenantUsers(tenantId, { status, role });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("[ADMIN] Error listing tenant users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list tenant users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { tenantId } = await params;
    const body = await request.json();
    
    const input: InviteTenantUserInput = {
      email: body.email,
      name: body.name,
      password: body.password, // Optional: if provided, use this password
      role: body.role || "TENANT_ADMIN", // Default to TENANT_ADMIN for admin panel
      sendEmail: body.sendEmail ?? true,
    };

    if (!input.email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await addUserToTenant(tenantId, input, authResult.userId);

    // Include generated password in response if a new user was created
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        userId: result.userId,
        role: result.role,
        status: result.status,
        user: result.user,
        isNewUser: result.isNewUser,
        generatedPassword: result.generatedPassword, // Only present for newly created admin users
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Error adding user to tenant:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add user to tenant" },
      { status: 500 }
    );
  }
}
