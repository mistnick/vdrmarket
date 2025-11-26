import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;

        // Check if session exists and belongs to current user
        const targetSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true },
        });

        if (!targetSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (targetSession.user.email !== session.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete the session
        await prisma.session.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({
            success: true,
            message: "Session revoked successfully",
        });
    } catch (error) {
        console.error("Error revoking session:", error);
        return NextResponse.json(
            { error: "Failed to revoke session" },
            { status: 500 }
        );
    }
}
