import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAllGroupsUsers } from "@/lib/vdr/authorization";
import { UpdateGroupPayload } from "@/lib/vdr/types";

// GET /api/vdr/[dataRoomId]/groups/[groupId] - Get group details
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

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
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
                            },
                        },
                    },
                },
            },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error("Error fetching group:", error);
        return NextResponse.json(
            { error: "Failed to fetch group" },
            { status: 500 }
        );
    }
}

// PATCH /api/vdr/[dataRoomId]/groups/[groupId] - Update group
export async function PATCH(
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
        const canManage = await canManageAllGroupsUsers(user.id, dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to update groups" },
                { status: 403 }
            );
        }

        const body: UpdateGroupPayload = await req.json();

        // Update the group
        const group = await prisma.group.update({
            where: { id: groupId },
            data: {
                name: body.name,
                description: body.description,
                canViewDueDiligenceChecklist: body.canViewDueDiligenceChecklist,
                canManageDocumentPermissions: body.canManageDocumentPermissions,
                canViewGroupUsers: body.canViewGroupUsers,
                canManageUsers: body.canManageUsers,
                canViewGroupActivity: body.canViewGroupActivity,
            },
            include: {
                members: true,
            },
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error("Error updating group:", error);
        return NextResponse.json(
            { error: "Failed to update group" },
            { status: 500 }
        );
    }
}

// DELETE /api/vdr/[dataRoomId]/groups/[groupId] - Delete group
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
        const canManage = await canManageAllGroupsUsers(user.id, dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to delete groups" },
                { status: 403 }
            );
        }

        // Delete the group (cascade will remove members)
        await prisma.group.delete({
            where: { id: groupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json(
            { error: "Failed to delete group" },
            { status: 500 }
        );
    }
}
