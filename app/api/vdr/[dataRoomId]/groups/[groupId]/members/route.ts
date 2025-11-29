import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAllGroupsUsers, canManageUsers } from "@/lib/vdr/authorization";

// GET /api/vdr/[dataRoomId]/groups/[groupId]/members - List group members
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; groupId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, groupId } = await params;

        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        status: true,
                        accessType: true,
                        accessStartAt: true,
                        accessEndAt: true,
                        twoFactorEnabled: true,
                        isActive: true,
                    },
                },
            },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}

// POST /api/vdr/[dataRoomId]/groups/[groupId]/members - Add members to group
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; groupId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, groupId } = await params;

        // Check permission - admin or group-level user management
        const canManageAll = await canManageAllGroupsUsers(user.id, dataRoomId);
        const canManageGroup = await canManageUsers(user.id, dataRoomId, "group");

        if (!canManageAll && !canManageGroup) {
            return NextResponse.json(
                { error: "You do not have permission to manage group members" },
                { status: 403 }
            );
        }

        const { userIds }: { userIds: string[] } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: "userIds array is required" },
                { status: 400 }
            );
        }

        // Add members to group (ignore duplicates)
        const createPromises = userIds.map((userId) =>
            prisma.groupMember.upsert({
                where: {
                    groupId_userId: {
                        groupId,
                        userId,
                    },
                },
                update: {},
                create: {
                    groupId,
                    userId,
                },
            })
        );

        await Promise.all(createPromises);

        // Return updated member list
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Error adding members:", error);
        return NextResponse.json(
            { error: "Failed to add members" },
            { status: 500 }
        );
    }
}

// DELETE /api/vdr/[dataRoomId]/groups/[groupId]/members - Remove member from group
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string; groupId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, groupId } = await params;

        // Check permission
        const canManageAll = await canManageAllGroupsUsers(user.id, dataRoomId);
        const canManageGroup = await canManageUsers(user.id, dataRoomId, "group");

        if (!canManageAll && !canManageGroup) {
            return NextResponse.json(
                { error: "You do not have permission to manage group members" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const userIdToRemove = searchParams.get("userId");

        if (!userIdToRemove) {
            return NextResponse.json(
                { error: "userId query parameter is required" },
                { status: 400 }
            );
        }

        await prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId: userIdToRemove,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json(
            { error: "Failed to remove member" },
            { status: 500 }
        );
    }
}
