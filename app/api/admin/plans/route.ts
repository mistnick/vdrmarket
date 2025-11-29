/**
 * Super Admin - Plans Management API
 * GET /api/admin/plans - List all plans
 * POST /api/admin/plans - Create new plan
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: {
            tenants: true,
          },
        },
      },
      orderBy: { priceMonthly: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("[ADMIN] Error listing plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list plans" },
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
    
    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        description: body.description,
        maxVdr: body.maxVdr ?? 1,
        maxAdminUsers: body.maxAdminUsers ?? 3,
        maxStorageMb: body.maxStorageMb ?? 1024,
        durationDays: body.durationDays,
        priceMonthly: body.priceMonthly,
        priceYearly: body.priceYearly,
        features: body.features || {},
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Error creating plan:", error);
    
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "Plan name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
