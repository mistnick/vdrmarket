/**
 * Check Super Admin Status API
 * GET /api/auth/check-super-admin
 * Returns whether the current user is a super admin
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { isSuperAdmin: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isSuperAdmin: true },
    });

    return NextResponse.json({
      isSuperAdmin: user?.isSuperAdmin ?? false,
    });
  } catch (error) {
    console.error("[CHECK-SUPER-ADMIN] Error:", error);
    return NextResponse.json(
      { isSuperAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
