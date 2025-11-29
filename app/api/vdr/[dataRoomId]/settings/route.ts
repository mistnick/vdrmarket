import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageQA, isAdministrator } from "@/lib/vdr/authorization";

// GET /api/vdr/[dataRoomId]/settings - Get data room VDR settings
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
            select: {
                id: true,
                name: true,
                description: true,
                qnaEnabled: true,
                dueDiligenceChecklistEnabled: true,
                archivedAt: true,
            },
        });

        if (!dataRoom) {
            return NextResponse.json({ error: "Data room not found" }, { status: 404 });
        }

        return NextResponse.json(dataRoom);
    } catch (error) {
        console.error("Error fetching data room settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PATCH /api/vdr/[dataRoomId]/settings - Update data room VDR settings (admin only)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Only administrators can update settings
        const isAdmin = await isAdministrator(user.id, dataRoomId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Only administrators can update settings" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { qnaEnabled, dueDiligenceChecklistEnabled } = body;

        const updatedDataRoom = await prisma.dataRoom.update({
            where: { id: dataRoomId },
            data: {
                qnaEnabled,
                dueDiligenceChecklistEnabled,
            },
        });

        return NextResponse.json(updatedDataRoom);
    } catch (error) {
        console.error("Error updating data room settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}

// DELETE /api/vdr/[dataRoomId]/settings/archive - Archive data room (admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Only administrators can archive
        const isAdmin = await isAdministrator(user.id, dataRoomId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Only administrators can archive data rooms" },
                { status: 403 }
            );
        }

        const archivedDataRoom = await prisma.dataRoom.update({
            where: { id: dataRoomId },
            data: {
                archivedAt: new Date(),
            },
        });

        return NextResponse.json({
            message: "Data room archived successfully",
            dataRoom: archivedDataRoom,
        });
    } catch (error) {
        console.error("Error archiving data room:", error);
        return NextResponse.json(
            { error: "Failed to archive data room" },
            { status: 500 }
        );
    }
}
