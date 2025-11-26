/**
 * Team Invitation Validation API
 * GET /api/teams/invitations/validate/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Get invited by user info
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "TEAM_INVITATION_CREATED",
        resourceId: invitation.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        teamId: invitation.team.id,
        teamName: invitation.team.name,
        email: invitation.email,
        role: invitation.role,
        invitedBy: auditLog?.user || { name: null, email: "Admin" },
        createdAt: invitation.createdAt.toISOString(),
        expires: invitation.expires.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Errore nella validazione dell'invito" },
      { status: 500 }
    );
  }
}
