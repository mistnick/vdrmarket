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

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId, tagId } = await params;

        // Check access via GroupMember (ADMINISTRATOR group type)
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                OR: [
                    { ownerId: session.userId },
                    {
                        dataRoom: {
                            groups: {
                                some: {
                                    type: "ADMINISTRATOR",
                                    members: {
                                        some: {
                                            userId: session.userId,
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
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
