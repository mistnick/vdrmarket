import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id] - Get data room details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                        },
                    },
                },
            },
            include: {
                team: true,
                _count: {
                    select: {
                        documents: true,
                        folders: true,
                        permissions: true,
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: dataRoom,
        });
    } catch (error) {
        console.error("Error fetching data room:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/datarooms/[id] - Update data room
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description, isPublic } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check if user has access to this data room
        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                        },
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or access denied" },
                { status: 404 }
            );
        }

        // Update data room
        const updatedDataRoom = await prisma.dataRoom.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isPublic !== undefined && { isPublic }),
            },
        });

        // Log audit event
        await prisma.auditLog.create({
            data: {
                teamId: dataRoom.teamId,
                userId: user!.id,
                action: "updated",
                resourceType: "dataroom",
                resourceId: id,
                metadata: { changes: body },
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedDataRoom,
        });
    } catch (error) {
        console.error("Error updating data room:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/datarooms/[id] - Delete data room
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check if user has access to this data room
        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                            role: "OWNER", // Only owners can delete
                        },
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or insufficient permissions" },
                { status: 404 }
            );
        }

        // Delete data room (cascade will handle related records)
        await prisma.dataRoom.delete({
            where: { id },
        });

        // Log audit event
        await prisma.auditLog.create({
            data: {
                teamId: dataRoom.teamId,
                userId: user!.id,
                action: "deleted",
                resourceType: "dataroom",
                resourceId: id,
                metadata: { dataRoomName: dataRoom.name },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Data room deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting data room:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
