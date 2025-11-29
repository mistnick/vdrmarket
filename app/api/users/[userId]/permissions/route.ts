import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getUserPermissions } from "@/lib/auth/permissions";

/**
 * GET /api/users/[userId]/permissions
 * Get user permissions for a data room (based on GroupType membership)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const dataRoomId = searchParams.get("dataRoomId");

        if (!dataRoomId) {
            return NextResponse.json({ error: "DataRoom ID required" }, { status: 400 });
        }

        // Get user's permissions based on GroupType membership
        const permissions = await getUserPermissions(userId, dataRoomId);

        return NextResponse.json({
            success: true,
            permissions: permissions.map(p => ({ permission: p })),
        });
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/[userId]/permissions
 * Update user permissions (simplified - just updates role)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await params;
        const body = await request.json();
        const { dataRoomId, permissions } = body;

        if (!dataRoomId || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        // Check if requester has permission to manage roles (ADMINISTRATOR group type)
        const requesterMember = await prisma.groupMember.findFirst({
            where: {
                userId: session.userId,
                group: {
                    dataRoomId,
                    type: "ADMINISTRATOR",
                },
            },
        });

        if (!requesterMember) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // For now, permissions are managed through roles
        // This endpoint acknowledges the request but doesn't create individual permission records
        // Individual permissions would require creating Permission records first

        return NextResponse.json({
            success: true,
            message: "Permissions are managed through user roles. Use the role selector to change permissions.",
        });
    } catch (error) {
        console.error("Error updating user permissions:", error);
        return NextResponse.json(
            { error: "Failed to update permissions" },
            { status: 500 }
        );
    }
}
