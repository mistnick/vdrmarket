import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/datarooms/[id]/my-permissions
 * Returns the current user's permissions for this data room based on their group memberships
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user's group memberships for this data room
        const memberships = await prisma.groupMember.findMany({
            where: {
                userId: session.userId,
                group: {
                    dataRoomId: id,
                },
            },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        canViewDueDiligenceChecklist: true,
                        canManageDocumentPermissions: true,
                        canViewGroupUsers: true,
                        canManageUsers: true,
                        canViewGroupActivity: true,
                    },
                },
            },
        });

        // Transform to response format
        const response = {
            memberships: memberships.map((m) => ({
                groupId: m.group.id,
                groupType: m.group.type,
                groupName: m.group.name,
                canViewDueDiligenceChecklist: m.group.canViewDueDiligenceChecklist,
                canManageDocumentPermissions: m.group.canManageDocumentPermissions,
                canViewGroupUsers: m.group.canViewGroupUsers,
                canManageUsers: m.group.canManageUsers,
                canViewGroupActivity: m.group.canViewGroupActivity,
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
