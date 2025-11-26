import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { randomBytes } from "crypto";
import { sendTeamInvitationEmail } from "@/lib/email/service";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team invitations
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: {
          include: {
            team: {
              include: {
                invitations: {
                  where: {
                    expires: {
                      gte: new Date(),
                    },
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const invitations = user.teams[0].team.invitations;

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["viewer", "member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { email: session.email },
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

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const teamMembership = user.teams[0];
    const team = teamMembership.team;

    // Check if requester has permission
    if (
      teamMembership.role !== "owner" &&
      teamMembership.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = team.members.find((m: any) => m.user.email === email);
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: team.id,
        email,
        expires: {
          gte: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent" },
        { status: 400 }
      );
    }

    // Create invitation
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: team.id,
        email,
        role,
        token,
        expires,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        teamId: team.id,
        action: "invite_sent",
        resourceType: "invitation",
        resourceId: invitation.id,
        metadata: {
          invitedEmail: email,
          role,
        },
      },
    });

    // Send invitation email
    const invitationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/teams/invitations/${token}`;
    await sendTeamInvitationEmail({
      to: email,
      inviterName: user.name || session.email,
      teamName: team.name,
      link: invitationLink,
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
