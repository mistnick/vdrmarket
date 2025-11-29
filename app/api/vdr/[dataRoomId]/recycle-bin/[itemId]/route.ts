import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessRecycleBin } from "@/lib/vdr/authorization";

// DELETE /api/vdr/[dataRoomId]/recycle-bin/[itemId] - Permanently delete item
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; itemId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, itemId } = await params;

        // Check permission
        const canAccess = await canAccessRecycleBin(user.id, dataRoomId);
        if (!canAccess) {
            return NextResponse.json(
                { error: "You do not have permission to permanently delete items" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        if (!type) {
            return NextResponse.json(
                { error: "type query parameter is required" },
                { status: 400 }
            );
        }

        if (type === "document") {
            // TODO: Delete physical file from storage
            await prisma.document.delete({
                where: { id: itemId },
            });
        } else if (type === "folder") {
            // Cascade delete will handle subfolders and documents
            await prisma.folder.delete({
                where: { id: itemId },
            });
        } else {
            return NextResponse.json(
                { error: "Invalid type" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Item permanently deleted",
        });
    } catch (error) {
        console.error("Error permanently deleting item:", error);
        return NextResponse.json(
            { error: "Failed to permanently delete item" },
            { status: 500 }
        );
    }
}
