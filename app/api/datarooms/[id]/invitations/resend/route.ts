import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

// POST /api/datarooms/[id]/invitations/resend - Resend an invitation
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

        // Get invitation
        const invitation = await prisma.userInvitation.findUnique({
            where: { id: invitationId },
            include: {
                dataRoom: {
                    select: { name: true },
                },
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Generate new token and extend expiration
        const newToken = crypto.randomBytes(32).toString("hex");
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

        // Update invitation
        const updatedInvitation = await prisma.userInvitation.update({
            where: { id: invitationId },
            data: {
                token: newToken,
                expiresAt: newExpiresAt,
            },
        });

        // Send new invitation email
        let emailSent = true;
        let emailError: string | null = null;
        let emailMessage: string | null = null;
        
        try {
            const { sendInvitationEmail, generateInvitationEmailContent } = await import("@/lib/vdr/email-service");
            
            // Generate email content for potential display
            emailMessage = await generateInvitationEmailContent({
                to: invitation.email,
                inviterName: user.name || user.email,
                dataRoomName: invitation.dataRoom.name,
                token: newToken,
                expiresAt: newExpiresAt,
            });
            
            await sendInvitationEmail({
                to: invitation.email,
                inviterName: user.name || user.email,
                dataRoomName: invitation.dataRoom.name,
                token: newToken,
                expiresAt: newExpiresAt,
            });
        } catch (err) {
            console.error("Error sending invitation email:", err);
            emailSent = false;
            emailError = err instanceof Error ? err.message : "Failed to send email";
        }

        return NextResponse.json({
            success: true,
            data: updatedInvitation,
            message: emailSent ? "Invitation resent successfully" : "Invitation updated but email could not be sent",
            emailSent,
            emailError,
            emailMessage: emailSent ? null : emailMessage,
        });
    } catch (error) {
        console.error("Error resending invitation:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
