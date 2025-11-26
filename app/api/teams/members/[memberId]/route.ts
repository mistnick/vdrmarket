import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/utils/audit-log";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!["viewer", "member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
        user: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if requester has permission (owner or admin)
    const requester = teamMember.team.members.find(
      (m) => m.user.email === session.email
    );

    if (
      !requester ||
      (requester.role !== "owner" && requester.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot change owner role
    if (teamMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 400 }
      );
    }

    // Update role
    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    // Create audit log
    await createAuditLog({
      action: "TEAM_MEMBER_ROLE_UPDATED",
      userId: requester.userId,
      teamId: teamMember.teamId,
      resourceType: "TEAM_MEMBER",
      resourceId: memberId,
      metadata: {
        targetUser: teamMember.user.email,
        oldRole: teamMember.role,
        newRole: role,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;

    // Get team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
        user: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if requester has permission
    const requester = teamMember.team.members.find(
      (m) => m.user.email === session.email
    );

    if (
      !requester ||
      (requester.role !== "owner" && requester.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot remove owner
    if (teamMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove team owner" },
        { status: 400 }
      );
    }

    // Delete member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // Create audit log
    await createAuditLog({
      action: "TEAM_MEMBER_REMOVED",
      userId: requester.userId,
      teamId: teamMember.teamId,
      resourceType: "TEAM_MEMBER",
      resourceId: memberId,
      metadata: {
        removedUser: teamMember.user.email,
        role: teamMember.role,
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
