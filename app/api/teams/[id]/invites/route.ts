import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { sendTeamInvitationEmail } from '@/lib/email/service';
import crypto from 'crypto';

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

/**
 * GET /api/teams/[id]/invites
 * Get pending team invitations
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: teamId } = await params;

        // Check if user is a member of the team
        const member = await prisma.teamMember.findFirst({
            where: {
                teamId,
                user: {
                    email: session.email,
                },
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Only admins and owners can view invitations
        if (member.role !== 'owner' && member.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only team owners and admins can view invitations' },
                { status: 403 }
            );
        }

        // Get pending invitations
        const invitations = await prisma.teamInvitation.findMany({
            where: {
                teamId,
                expires: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            invitations: invitations.map(inv => ({
                id: inv.id,
                email: inv.email,
                role: inv.role,
                createdAt: inv.createdAt,
                expiresAt: inv.expires,
            })),
        });
    } catch (error) {
        console.error('Error fetching team invitations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/teams/[id]/invites
 * Create a new team invitation and send email
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: teamId } = await params;
        const body = await request.json();
        const { email, role = 'member' } = body;

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['owner', 'admin', 'member', 'viewer'];
        if (!validRoles.includes(role.toLowerCase())) {
            return NextResponse.json(
                { error: 'Invalid role. Must be one of: owner, admin, member, viewer' },
                { status: 400 }
            );
        }

        // Get team and check permissions
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    where: {
                        user: {
                            email: session.email,
                        },
                    },
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        const member = team.members[0];
        if (!member) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Only admins and owners can send invitations
        if (member.role !== 'owner' && member.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only team owners and admins can invite members' },
                { status: 403 }
            );
        }

        // Check if user is already a member
        const existingMember = await prisma.teamMember.findFirst({
            where: {
                teamId,
                user: {
                    email,
                },
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: 'User is already a member of this team' },
                { status: 400 }
            );
        }

        // Check if there's already a pending invitation
        const existingInvite = await prisma.teamInvitation.findFirst({
            where: {
                teamId,
                email,
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (existingInvite) {
            return NextResponse.json(
                { error: 'An invitation for this email is already pending' },
                { status: 400 }
            );
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation (expires in 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.teamInvitation.create({
            data: {
                teamId,
                email,
                role: role.toLowerCase(),
                token,
                expires: expiresAt,
            },
        });

        // Generate invitation link
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const invitationLink = `${baseUrl}/teams/invite/${token}`;

        // Send invitation email
        const emailResult = await sendTeamInvitationEmail({
            to: email,
            inviterName: member.user.name || session.email,
            teamName: team.name,
            link: invitationLink,
        });

        // Log audit event
        await prisma.auditLog.create({
            data: {
                teamId,
                userId: member.userId,
                action: 'invited',
                resourceType: 'team_member',
                resourceId: invitation.id,
                metadata: {
                    email,
                    role,
                    emailSent: emailResult,
                },
            },
        });

        return NextResponse.json({
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expires,
                emailSent: emailResult,
            },
        });
    } catch (error) {
        console.error('Error creating team invitation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

