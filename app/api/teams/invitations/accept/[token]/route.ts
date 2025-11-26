/**
 * Team Invitation Accept API
 * POST /api/teams/invitations/accept/[token]
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
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invito non trovato" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expires) {
      return NextResponse.json(
        { error: "Questo invito è scaduto" },
        { status: 410 }
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

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: session.userId,
        },
      },
    });

    if (existingMember) {
      // Delete invitation and return success
      await prisma.teamInvitation.delete({
        where: { id: invitation.id },
      });

      return NextResponse.json({
        message: "Sei già membro di questo team",
        team: invitation.team,
      });
    }

    // Add user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        id: nanoid(),
        teamId: invitation.teamId,
        userId: session.userId,
        role: invitation.role,
      },
    });

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
        action: "TEAM_MEMBER_JOINED",
        resourceType: "team",
        resourceId: invitation.teamId,
        metadata: {
          role: invitation.role,
          viaInvitation: true,
        },
      },
    });

    return NextResponse.json({
      message: "Invito accettato con successo",
      team: invitation.team,
      member: teamMember,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Errore nell'accettazione dell'invito" },
      { status: 500 }
    );
  }
}
