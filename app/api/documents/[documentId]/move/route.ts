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
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { folderId, dataRoomId } = await req.json();

        // Get document to verify ownership/access via GroupMember (ADMINISTRATOR group type)
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
            include: {
                dataRoom: true,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
        }

        // If folderId is provided, verify it belongs to the same data room
        if (folderId) {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId },
            });

            if (!folder || folder.dataRoomId !== document.dataRoomId) {
                return NextResponse.json(
                    { error: "Invalid folder" },
                    { status: 400 }
                );
            }
        }

        // If dataRoomId is provided, verify user has access to that data room (ADMINISTRATOR group type)
        if (dataRoomId && dataRoomId !== document.dataRoomId) {
            const hasAccess = await prisma.groupMember.findFirst({
                where: {
                    userId: session.userId,
                    group: {
                        dataRoomId: dataRoomId,
                        type: "ADMINISTRATOR",
                    },
                },
            });

            if (!hasAccess) {
                return NextResponse.json(
                    { error: "Invalid data room or access denied" },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: { folderId: string | null; dataRoomId?: string } = {
            folderId: folderId || null,
        };
        
        // dataRoomId is required and cannot be null
        if (dataRoomId) {
            updateData.dataRoomId = dataRoomId;
        }

        // Update document
        const updatedDocument = await prisma.document.update({
            where: { id: documentId },
            data: updateData,
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.userId,
                dataRoomId: document.dataRoomId,
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
