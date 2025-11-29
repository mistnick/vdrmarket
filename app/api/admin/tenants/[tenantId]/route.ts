/**
 * Super Admin - Single Tenant API
 * GET /api/admin/tenants/[tenantId] - Get tenant details
 * PUT /api/admin/tenants/[tenantId] - Update tenant
 * DELETE /api/admin/tenants/[tenantId] - Soft delete tenant
 */

import { NextResponse } from "next/server";
import { 
  requireSuperAdmin, 
  getTenantById, 
  updateTenant, 
  deleteTenant,
  getTenantUsage,
} from "@/lib/tenant";
import type { UpdateTenantInput } from "@/lib/tenant";

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
    
    const [tenant, usage] = await Promise.all([
      getTenantById(tenantId),
      getTenantUsage(tenantId).catch(() => null),
    ]);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        usage,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Error getting tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get tenant" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { tenantId } = await params;
    const body = await request.json();
    
    const input: UpdateTenantInput = {
      name: body.name,
      description: body.description,
      logo: body.logo,
      status: body.status,
      planId: body.planId,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      settings: body.settings,
      customDomain: body.customDomain,
    };

    // Remove undefined values
    Object.keys(input).forEach(key => {
      if (input[key as keyof UpdateTenantInput] === undefined) {
        delete input[key as keyof UpdateTenantInput];
      }
    });

    const tenant = await updateTenant(tenantId, input, authResult.userId);

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("[ADMIN] Error updating tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tenant" },
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
    const { tenantId } = await params;
    
    await deleteTenant(tenantId, authResult.userId);

    return NextResponse.json({
      success: true,
      message: "Tenant deleted successfully",
    });
  } catch (error) {
    console.error("[ADMIN] Error deleting tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
