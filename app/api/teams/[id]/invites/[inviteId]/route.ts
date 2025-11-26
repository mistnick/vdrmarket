import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

type RouteParams = {
    params: Promise<{
        id: string;
        inviteId: string;
    }>;
};

/**
 * DELETE /api/teams/[id]/invites/[inviteId]
 * Cancel a pending team invitation
 */
export async function DELETE(
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

        const { id: teamId, inviteId } = await params;

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

        // Only admins and owners can cancel invitations
        if (member.role !== 'owner' && member.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only team owners and admins can cancel invitations' },
                { status: 403 }
            );
        }

        // Verify invitation exists and belongs to this team
        const invitation = await prisma.teamInvitation.findUnique({
            where: { id: inviteId },
        });

        if (!invitation || invitation.teamId !== teamId) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Delete invitation
        await prisma.teamInvitation.delete({
            where: { id: inviteId },
        });

        // Log audit action
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (user) {
            await prisma.auditLog.create({
                data: {
                    teamId,
                    userId: user.id,
                    action: 'deleted',
                    resourceType: 'team_invitation',
                    resourceId: inviteId,
                    metadata: { email: invitation.email, role: invitation.role },
                    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                    userAgent: request.headers.get('user-agent'),
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling team invitation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
