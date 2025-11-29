import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
    params: Promise<{ dataRoomId: string; documentId: string; groupId: string }>;
}

// DELETE - Remove group permission from document
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, documentId, groupId } = await params;

        // Verify document exists and belongs to this data room
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                dataRoomId,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete the permission
        await prisma.documentGroupPermission.delete({
            where: {
                documentId_groupId: {
                    documentId,
                    groupId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document permission:", error);
        return NextResponse.json(
            { error: "Failed to delete document permission" },
            { status: 500 }
        );
    }
}
