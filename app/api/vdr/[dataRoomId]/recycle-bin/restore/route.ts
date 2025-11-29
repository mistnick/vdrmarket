import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessRecycleBin } from "@/lib/vdr/authorization";

// POST /api/vdr/[dataRoomId]/recycle-bin/restore - Restore deleted items
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Check permission
        const canAccess = await canAccessRecycleBin(user.id, dataRoomId);
        if (!canAccess) {
            return NextResponse.json(
                { error: "You do not have permission to restore items" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { type, itemId } = body;

        if (!type || !itemId) {
            return NextResponse.json(
                { error: "type and itemId are required" },
                { status: 400 }
            );
        }

        if (type === "document") {
            await prisma.document.update({
                where: { id: itemId },
                data: {
                    deletedAt: null,
                    deletedById: null,
                },
            });
        } else if (type === "folder") {
            await prisma.folder.update({
                where: { id: itemId },
                data: {
                    deletedAt: null,
                    deletedById: null,
                },
            });
        } else {
            return NextResponse.json(
                { error: "Invalid type. Must be 'document' or 'folder'" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Item restored successfully",
        });
    } catch (error) {
        console.error("Error restoring item:", error);
        return NextResponse.json(
            { error: "Failed to restore item" },
            { status: 500 }
        );
    }
}
