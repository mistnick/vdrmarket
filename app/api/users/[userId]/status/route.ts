import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/utils/audit-log";

/**
 * PATCH /api/users/[userId]/status
 * Activate or deactivate a user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if requester has permission (must be owner or admin of at least one shared team)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cannot deactivate yourself
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "Cannot change your own active status" },
        { status: 400 }
      );
    }

    // Check if requester has admin/owner role in any team with the target user
    let hasPermission = false;
    let teamContext: { teamId: string; teamName: string } | null = null;

    for (const targetMembership of targetUser.teams) {
      const team = targetMembership.team;
      const requesterInTeam = team.members.find(
        (m) => m.user.email === session.email
      );

      if (requesterInTeam && ["owner", "admin"].includes(requesterInTeam.role)) {
        // Cannot deactivate team owner
        if (targetMembership.role === "owner") {
          return NextResponse.json(
            { error: "Cannot deactivate team owner" },
            { status: 400 }
          );
        }
        hasPermission = true;
        teamContext = { teamId: team.id, teamName: team.name };
        break;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You must be an owner or admin to change user status" },
        { status: 403 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      userId: currentUser.id,
      teamId: teamContext?.teamId || null,
      resourceType: "USER",
      resourceId: userId,
      metadata: {
        targetUser: targetUser.email,
        targetUserName: targetUser.name,
        isActive,
        performedBy: session.email,
        teamContext: teamContext?.teamName,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[userId]/status
 * Get user active status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}
