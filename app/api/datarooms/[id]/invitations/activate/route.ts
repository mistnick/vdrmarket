import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// POST /api/datarooms/[id]/invitations/activate - Manually activate a pending invitation
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { invitationId } = body;

        if (!invitationId) {
            return NextResponse.json(
                { success: false, error: "Invitation ID is required" },
                { status: 400 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check admin access (ADMINISTRATOR group type)
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: currentUser.id,
                group: {
                    dataRoomId: id,
                    type: "ADMINISTRATOR",
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json(
                { success: false, error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Get invitation with related data
        const invitation = await prisma.userInvitation.findUnique({
            where: { id: invitationId },
            include: {
                dataRoom: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found" },
                { status: 404 }
            );
        }

        if (invitation.dataRoomId !== id) {
            return NextResponse.json(
                { success: false, error: "Invitation does not belong to this data room" },
                { status: 400 }
            );
        }

        // Find or create the user
        let user = await prisma.user.findUnique({
            where: { email: invitation.email },
        });

        if (!user) {
            // Create the user
            user = await prisma.user.create({
                data: {
                    email: invitation.email,
                    name: invitation.email.split("@")[0], // Default name from email
                    status: "ACTIVE",
                },
            });
        } else {
            // Update user status to ACTIVE
            user = await prisma.user.update({
                where: { id: user.id },
                data: { status: "ACTIVE" },
            });
        }

        // Add user to groups specified in the invitation
        const groupIds = Array.isArray(invitation.groupIds) 
            ? (invitation.groupIds as string[]) 
            : [];
        
        for (const groupId of groupIds) {
            // Check if user is already a member
            const existingMember = await prisma.groupMember.findFirst({
                where: {
                    userId: user.id,
                    groupId: groupId,
                },
            });

            if (!existingMember) {
                await prisma.groupMember.create({
                    data: {
                        userId: user.id,
                        groupId: groupId,
                        role: "member",
                    },
                });
            }
        }

        // Delete the invitation
        await prisma.userInvitation.delete({
            where: { id: invitationId },
        });

        return NextResponse.json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                status: user.status,
            },
            message: "User activated successfully",
        });
    } catch (error) {
        console.error("Error activating invitation:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
