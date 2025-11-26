import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/users/[userId]/permissions
 * Get user permissions for a team (simplified - returns role-based permissions)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get("teamId");

        if (!teamId) {
            return NextResponse.json({ error: "Team ID required" }, { status: 400 });
        }

        // Get user's role in the team
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });

        // Return role-based permissions
        const rolePermissions = getRolePermissions(teamMember?.role || "viewer");

        return NextResponse.json({
            success: true,
            permissions: rolePermissions.map(p => ({ permission: p })),
        });
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

function getRolePermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
        owner: [
            "documents.create", "documents.edit", "documents.delete", "documents.view",
            "links.create", "links.manage",
            "datarooms.create", "datarooms.manage",
            "teams.invite_members", "teams.manage_roles", "teams.view_members",
            "analytics.view",
        ],
        admin: [
            "documents.create", "documents.edit", "documents.delete", "documents.view",
            "links.create", "links.manage",
            "datarooms.create", "datarooms.manage",
            "teams.invite_members", "teams.view_members",
            "analytics.view",
        ],
        member: [
            "documents.create", "documents.view",
            "links.create",
            "datarooms.create",
            "teams.view_members",
        ],
        viewer: [
            "documents.view",
            "teams.view_members",
        ],
    };

    return permissionMap[role] || permissionMap.viewer;
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
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await params;
        const body = await request.json();
        const { teamId, permissions } = body;

        if (!teamId || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        // Check if requester has permission to manage roles
        const requester = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!requester) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const requesterMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: requester.id,
                },
            },
        });

        if (!requesterMember || !["owner", "admin"].includes(requesterMember.role)) {
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
