import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
    params: Promise<{ dataRoomId: string; folderId: string; groupId: string }>;
}

// DELETE - Remove group permission from folder
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, folderId, groupId } = await params;

        // Verify folder exists and belongs to this data room
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                dataRoomId,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Delete the permission
        await prisma.folderGroupPermission.delete({
            where: {
                folderId_groupId: {
                    folderId,
                    groupId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting folder permission:", error);
        return NextResponse.json(
            { error: "Failed to delete folder permission" },
            { status: 500 }
        );
    }
}
