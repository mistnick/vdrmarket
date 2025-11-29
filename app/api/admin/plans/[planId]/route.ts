/**
 * Super Admin - Single Plan API
 * GET /api/admin/plans/[planId] - Get plan details
 * PUT /api/admin/plans/[planId] - Update plan
 * DELETE /api/admin/plans/[planId] - Delete plan
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ planId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { planId } = await params;
    
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            tenants: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("[ADMIN] Error getting plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get plan" },
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
    const { planId } = await params;
    const body = await request.json();
    
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: body.name,
        description: body.description,
        maxVdr: body.maxVdr,
        maxAdminUsers: body.maxAdminUsers,
        maxStorageMb: body.maxStorageMb,
        durationDays: body.durationDays,
        priceMonthly: body.priceMonthly,
        priceYearly: body.priceYearly,
        features: body.features,
        isActive: body.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("[ADMIN] Error updating plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update plan" },
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
    const { planId } = await params;
    
    // Check if plan is in use
    const tenantsCount = await prisma.tenant.count({
      where: { planId },
    });

    if (tenantsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete plan: ${tenantsCount} tenant(s) are using it` 
        },
        { status: 400 }
      );
    }

    await prisma.plan.delete({
      where: { id: planId },
    });

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("[ADMIN] Error deleting plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
