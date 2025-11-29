import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAllGroupsUsers, canManageUsers } from "@/lib/vdr/authorization";
import { UpdateVDRUserPayload } from "@/lib/vdr/types";

// GET /api/vdr/[dataRoomId]/users/[userId] - Get user details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; userId: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
                accessType: true,
                accessStartAt: true,
                accessEndAt: true,
                allowedIps: true,
                twoFactorEnabled: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                groupMemberships: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                dataRoomId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PATCH /api/vdr/[dataRoomId]/users/[userId] - Update user
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; userId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, userId } = await params;

        // Check permission
        const canManageAll = await canManageAllGroupsUsers(user.id, dataRoomId);
        const canManageGroup = await canManageUsers(user.id, dataRoomId, "group");

        if (!canManageAll && !canManageGroup) {
            return NextResponse.json(
                { error: "You do not have permission to update users" },
                { status: 403 }
            );
        }

        const body: UpdateVDRUserPayload = await req.json();

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: body.status,
                accessType: body.accessType,
                accessStartAt: body.accessStartAt,
                accessEndAt: body.accessEndAt,
                allowedIps: body.allowedIps === null 
                    ? Prisma.DbNull 
                    : body.allowedIps === undefined 
                        ? undefined 
                        : body.allowedIps,
                twoFactorEnabled: body.require2FA,
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                accessType: true,
                accessStartAt: true,
                accessEndAt: true,
                allowedIps: true,
                twoFactorEnabled: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE /api/vdr/[dataRoomId]/users/[userId] - Deactivate user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; userId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, userId } = await params;

        // Check permission
        const canManageAll = await canManageAllGroupsUsers(user.id, dataRoomId);

        if (!canManageAll) {
            return NextResponse.json(
                { error: "You do not have permission to deactivate users" },
                { status: 403 }
            );
        }

        // Deactivate user
        await prisma.user.update({
            where: { id: userId },
            data: {
                status: "DEACTIVATED",
                isActive: false,
            },
        });

        return NextResponse.json({
            message: "User deactivated successfully",
        });
    } catch (error) {
        console.error("Error deactivating user:", error);
        return NextResponse.json(
            { error: "Failed to deactivate user" },
            { status: 500 }
        );
    }
}
