import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * GET /api/teams/[id]/members
 * Get all members of a team with their roles
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: teamId } = await params;
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has permission to view members
        const canView = await hasPermission(
            user.id,
            teamId,
            "teams.view_members"
        );

        if (!canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get team members with user data
        const members = await prisma.teamMember.findMany({
            where: {
                teamId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({
            success: true,
            data: members,
        });
    } catch (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json(
            { error: "Failed to fetch team members" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/teams/[id]/members
 * Update a team member's role
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: teamId } = await params;
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has permission to manage roles
        const canManage = await hasPermission(
            user.id,
            teamId,
            "teams.manage_roles"
        );

        if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { userId: targetUserId, role } = body;

        if (!targetUserId || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ["owner", "admin", "member", "viewer"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Update the member's role
        const updatedMember = await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId: targetUserId,
                },
            },
            data: {
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedMember,
        });
    } catch (error) {
        console.error("Error updating team member:", error);
        return NextResponse.json(
            { error: "Failed to update team member" },
            { status: 500 }
        );
    }
}
