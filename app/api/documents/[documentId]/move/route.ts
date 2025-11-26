import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const { documentId } = await params;
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { folderId, dataRoomId } = await req.json();

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get document to verify ownership/access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                team: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Check if user is member of the document's team
        const isMember = document.team.members.some(
            (member) => member.userId === user.id
        );

        if (!isMember && document.ownerId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // If folderId is provided, verify it belongs to the same team
        if (folderId) {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId },
            });

            if (!folder || folder.teamId !== document.teamId) {
                return NextResponse.json(
                    { error: "Invalid folder" },
                    { status: 400 }
                );
            }
        }

        // If dataRoomId is provided, verify it belongs to the same team
        if (dataRoomId) {
            const dataRoom = await prisma.dataRoom.findUnique({
                where: { id: dataRoomId },
            });

            if (!dataRoom || dataRoom.teamId !== document.teamId) {
                return NextResponse.json(
                    { error: "Invalid data room" },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: { folderId: string | null; dataRoomId?: string | null } = {
            folderId: folderId || null,
        };
        
        if (dataRoomId !== undefined) {
            updateData.dataRoomId = dataRoomId || null;
        }

        // Update document
        const updatedDocument = await prisma.document.update({
            where: { id: documentId },
            data: updateData,
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                teamId: document.teamId,
                action: "DOCUMENT_MOVED",
                resourceType: "DOCUMENT",
                resourceId: documentId,
                metadata: {
                    fromFolderId: document.folderId,
                    toFolderId: folderId,
                    fromDataRoomId: document.dataRoomId,
                    toDataRoomId: dataRoomId,
                },
            },
        });

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error("Error moving document:", error);
        return NextResponse.json(
            { error: "Failed to move document" },
            { status: 500 }
        );
    }
}
