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

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check access via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId: id,
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json(
                { success: false, error: "Data room not found or access denied" },
                { status: 404 }
            );
        }

        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id },
            include: {
                groups: true,
                _count: {
                    select: {
                        documents: true,
                        folders: true,
                        groups: true,
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found" },
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

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user has access to this data room via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId: id,
                },
            },
        });

        if (!memberAccess) {
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
                dataRoomId: id,
                userId: user.id,
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

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is owner via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId: id,
                },
            },
        });

        if (!memberAccess || memberAccess.role !== "owner") {
            return NextResponse.json(
                { success: false, error: "Data room not found or insufficient permissions" },
                { status: 404 }
            );
        }

        // Get data room name before delete
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id },
        });

        // Delete data room (cascade will handle related records)
        await prisma.dataRoom.delete({
            where: { id },
        });

        // Log audit event (note: this may fail if cascade deleted related audit_logs table constraints)
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: "deleted",
                    resourceType: "dataroom",
                    resourceId: id,
                    metadata: { dataRoomName: dataRoom?.name },
                },
            });
        } catch (e) {
            // Ignore audit log errors after deletion
        }

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
