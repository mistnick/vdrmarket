/**
 * Super Admin - Tenants List & Create API
 * GET /api/admin/tenants - List all tenants
 * POST /api/admin/tenants - Create new tenant
 */

import { NextResponse } from "next/server";
import { 
  requireSuperAdmin, 
  listTenants, 
  createTenant 
} from "@/lib/tenant";
import type { TenantListParams, CreateTenantInput } from "@/lib/tenant";

export async function GET(request: Request) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const params: TenantListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: searchParams.get("status") as TenantListParams["status"],
      planId: searchParams.get("planId") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as TenantListParams["sortBy"]) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as TenantListParams["sortOrder"]) || "desc",
    };

    const result = await listTenants(params);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[ADMIN] Error listing tenants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list tenants" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    
    const input: CreateTenantInput = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      logo: body.logo,
      planId: body.planId,
      durationDays: body.durationDays,
      settings: body.settings,
    };

    if (!input.name || !input.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const tenant = await createTenant(input, authResult.userId);

    return NextResponse.json({
      success: true,
      data: tenant,
    }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Error creating tenant:", error);
    
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "Tenant slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}
