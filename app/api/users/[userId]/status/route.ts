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
        groupMemberships: {
          include: {
            group: {
              include: {
                dataRoom: true,
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

    // Check if requester has permission (must be owner or admin of at least one shared dataRoom)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        groupMemberships: true,
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

    // Check if requester has admin/owner role in any dataRoom with the target user
    // Or if requester is in an ADMINISTRATOR type group for the same dataRoom
    let hasPermission = false;
    let dataRoomContext: { dataRoomId: string; dataRoomName: string } | null = null;

    for (const targetMembership of targetUser.groupMemberships) {
      const group = targetMembership.group;
      const dataRoom = group.dataRoom;
      
      // Check if requester is in the same group with owner/admin role
      const requesterInGroup = group.members.find(
        (m) => m.user.email === session.email
      );

      if (requesterInGroup && ["owner", "admin"].includes(requesterInGroup.role)) {
        // Cannot deactivate group owner
        if (targetMembership.role === "owner") {
          return NextResponse.json(
            { error: "Cannot deactivate group owner" },
            { status: 400 }
          );
        }
        hasPermission = true;
        dataRoomContext = { dataRoomId: dataRoom.id, dataRoomName: dataRoom.name };
        break;
      }

      // Also check if requester is in an ADMINISTRATOR group for this dataRoom
      const adminGroup = await prisma.group.findFirst({
        where: {
          dataRoomId: dataRoom.id,
          type: "ADMINISTRATOR",
          members: {
            some: {
              userId: currentUser.id,
            },
          },
        },
      });

      if (adminGroup) {
        // Cannot deactivate group owner
        if (targetMembership.role === "owner") {
          return NextResponse.json(
            { error: "Cannot deactivate group owner" },
            { status: 400 }
          );
        }
        hasPermission = true;
        dataRoomContext = { dataRoomId: dataRoom.id, dataRoomName: dataRoom.name };
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
      dataRoomId: dataRoomContext?.dataRoomId || null,
      resourceType: "USER",
      resourceId: userId,
      metadata: {
        targetUser: targetUser.email,
        targetUserName: targetUser.name,
        isActive,
        performedBy: session.email,
        dataRoomContext: dataRoomContext?.dataRoomName,
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
