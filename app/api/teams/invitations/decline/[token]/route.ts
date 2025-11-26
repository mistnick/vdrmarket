/**
 * Team Invitation Decline API
 * POST /api/teams/invitations/decline/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const { token } = await params;

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invito non trovato" },
        { status: 404 }
      );
    }

    // Verify email matches
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.email !== invitation.email) {
      return NextResponse.json(
        { error: "Questo invito è per un'altra email" },
        { status: 403 }
      );
    }

    // Delete invitation
    await prisma.teamInvitation.delete({
      where: { id: invitation.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId: session.userId,
        teamId: invitation.teamId,
        action: "TEAM_INVITATION_DECLINED",
        resourceType: "team",
        resourceId: invitation.teamId,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({
      message: "Invito rifiutato",
    });
  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json(
      { error: "Errore nel rifiuto dell'invito" },
      { status: 500 }
    );
  }
}
