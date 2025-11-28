/**
 * Custom Logout API Endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Log logout
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGOUT",
          resourceType: "USER",
          resourceId: user.id,
          metadata: {
            ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          },
        },
      }).catch(err => console.error("Failed to create audit log:", err));
    }

    // Delete custom session and all auth cookies
    await deleteSession();

    console.log("[LOGOUT] Session deleted successfully");

    return NextResponse.json({ success: true, redirect: "/" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Support GET for direct navigation - redirect to logout page
  return NextResponse.redirect(new URL("/auth/logout", request.url));
}

