import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
    request: NextRequest,
    {
        params,
    }: { params: Promise<{ documentId: string; tagId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId, tagId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                team: {
                    include: {
                        members: {
                            where: { userId: user.id },
                        },
                    },
                },
            },
        });

        if (!document || document.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Remove tag assignment
        await prisma.documentTag.deleteMany({
            where: {
                documentId,
                tagId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing tag:", error);
        return NextResponse.json(
            { error: "Failed to remove tag" },
            { status: 500 }
        );
    }
}
