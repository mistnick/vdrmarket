import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewDueDiligenceChecklist } from "@/lib/vdr/authorization";

// PATCH /api/vdr/due-diligence/items/[itemId] - Update checklist item (mark complete)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await params;

        // Get the item to find its checklist and data room
        const item = await prisma.dueDiligenceItem.findUnique({
            where: { id: itemId },
            include: {
                checklist: {
                    select: { dataRoomId: true },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Check permission
        const canView = await canViewDueDiligenceChecklist(
            user.id,
            item.checklist.dataRoomId
        );
        if (!canView) {
            return NextResponse.json(
                { error: "You do not have permission to update this item" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { completed } = body;

        // Update item
        const updatedItem = await prisma.dueDiligenceItem.update({
            where: { id: itemId },
            data: {
                completed,
                completedBy: completed ? user.id : null,
                completedAt: completed ? new Date() : null,
            },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Error updating checklist item:", error);
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        );
    }
}
