import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id]/groups - Get all groups for a data room
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

        // Get all groups for this data room with members
        const groups = await prisma.group.findMany({
            where: { dataRoomId: id },
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
                                emailVerified: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        documentPermissions: true,
                        folderPermissions: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: groups,
        });
    } catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/datarooms/[id]/groups - Create a new group
export async function POST(
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
        const { name, description, type, permissions } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "Group name is required" },
                { status: 400 }
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

        // Check if user has admin access (ADMINISTRATOR group type)
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId: id,
                    type: "ADMINISTRATOR",
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json(
                { success: false, error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Create group
        const group = await prisma.group.create({
            data: {
                dataRoomId: id,
                name,
                description,
                type: type || "USER",
                canViewDueDiligenceChecklist: permissions?.canViewDueDiligenceChecklist ?? false,
                canManageDocumentPermissions: permissions?.canManageDocumentPermissions ?? false,
                canViewGroupUsers: permissions?.canViewGroupUsers ?? false,
                canManageUsers: permissions?.canManageUsers ?? false,
                canViewGroupActivity: permissions?.canViewGroupActivity ?? false,
            },
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
                                emailVerified: true,
                            },
                        },
                    },
                },
            },
        });

        // Log audit event
        await prisma.auditLog.create({
            data: {
                dataRoomId: id,
                userId: user.id,
                action: "created",
                resourceType: "group",
                resourceId: group.id,
                metadata: { groupName: name },
            },
        });

        return NextResponse.json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
