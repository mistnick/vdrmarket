import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id]/invitations - Get pending invitations for a data room
export async function GET(
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

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check access via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId: id,
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json(
                { success: false, error: "Data room not found or access denied" },
                { status: 404 }
            );
        }

        // Get pending invitations for this data room
        const invitations = await prisma.userInvitation.findMany({
            where: { dataRoomId: id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Add status based on expiration
        const invitationsWithStatus = invitations.map((inv) => ({
            ...inv,
            status: inv.expiresAt < new Date() ? "expired" : "pending",
        }));

        return NextResponse.json({
            success: true,
            data: invitationsWithStatus,
        });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/datarooms/[id]/invitations - Delete an invitation
export async function DELETE(
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

        const { searchParams } = new URL(request.url);
        const invitationId = searchParams.get("invitationId");

        if (!invitationId) {
            return NextResponse.json(
                { success: false, error: "Invitation ID is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check admin access (ADMINISTRATOR group type)
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
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

        // Delete invitation
        await prisma.userInvitation.delete({
            where: { id: invitationId },
        });

        return NextResponse.json({
            success: true,
            message: "Invitation deleted",
        });
    } catch (error) {
        console.error("Error deleting invitation:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
