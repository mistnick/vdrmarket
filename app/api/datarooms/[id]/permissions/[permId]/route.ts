import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// DELETE /api/datarooms/[id]/permissions/[permId] - Remove permission
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; permId: string }> }
) {
    try {
        const { id, permId } = await params;
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

        // Check access (only admins/owners can remove permissions)
        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                            role: {
                                in: ["OWNER", "ADMIN"],
                            },
                        },
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or insufficient permissions" },
                { status: 403 }
            );
        }

        // Verify permission exists
        const permission = await prisma.dataRoomPermission.findUnique({
            where: { id: permId },
        });

        if (!permission || permission.dataRoomId !== id) {
            return NextResponse.json(
                { success: false, error: "Permission not found" },
                { status: 404 }
            );
        }

        // Delete permission
        await prisma.dataRoomPermission.delete({
            where: { id: permId },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                teamId: dataRoom.teamId,
                userId: user!.id,
                action: "deleted",
                resourceType: "permission",
                resourceId: permId,
                metadata: {
                    email: permission.email,
                    level: permission.level,
                    dataRoomId: id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Permission removed",
        });
    } catch (error) {
        console.error("Error removing permission:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/datarooms/[id]/permissions/[permId] - Update permission level
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; permId: string }> }
) {
    try {
        const { id, permId } = await params;
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { level } = body;

        if (!level) {
            return NextResponse.json(
                { success: false, error: "Level is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check access
        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                            role: {
                                in: ["OWNER", "ADMIN"],
                            },
                        },
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or insufficient permissions" },
                { status: 403 }
            );
        }

        // Update permission
        const permission = await prisma.dataRoomPermission.update({
            where: { id: permId },
            data: { level },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                teamId: dataRoom.teamId,
                userId: user!.id,
                action: "updated",
                resourceType: "permission",
                resourceId: permId,
                metadata: {
                    email: permission.email,
                    newLevel: level,
                    dataRoomId: id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: permission,
        });
    } catch (error) {
        console.error("Error updating permission:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
