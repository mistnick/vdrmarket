import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await params;

    // Get invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if requester has permission
    const requester = invitation.team.members.find(
      (m: any) => m.user.email === session.email
    );

    if (
      !requester ||
      (requester.role !== "owner" && requester.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete invitation
    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: requester.userId,
        teamId: invitation.teamId,
        action: "invitation_cancelled",
        resourceType: "invitation",
        resourceId: invitationId,
        metadata: {
          invitedEmail: invitation.email,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
