import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAllGroupsUsers } from "@/lib/vdr/authorization";
import { CreateGroupPayload } from "@/lib/vdr/types";

// GET /api/vdr/[dataRoomId]/groups - List all groups in a data room
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Check if user has access to this data room
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
        });

        if (!dataRoom) {
            return NextResponse.json({ error: "Data room not found" }, { status: 404 });
        }

        // Get all groups in the data room
        const groups = await prisma.group.findMany({
            where: { dataRoomId },
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
                        members: true,
                    },
                },
            },
            orderBy: [
                { type: "asc" }, // ADMINISTRATOR first
                { name: "asc" },
            ],
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json(
            { error: "Failed to fetch groups" },
            { status: 500 }
        );
    }
}

// POST /api/vdr/[dataRoomId]/groups - Create a new group
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Check if user can manage groups
        const canManage = await canManageAllGroupsUsers(user.id, dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to create groups" },
                { status: 403 }
            );
        }

        const body: CreateGroupPayload = await req.json();

        // Validate required fields
        if (!body.name || !body.type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            );
        }

        // Validate group type
        if (!["ADMINISTRATOR", "USER", "CUSTOM"].includes(body.type)) {
            return NextResponse.json(
                { error: "Invalid group type" },
                { status: 400 }
            );
        }

        // Create the group
        const group = await prisma.group.create({
            data: {
                name: body.name,
                description: body.description,
                type: body.type,
                dataRoomId,
                canViewDueDiligenceChecklist: body.canViewDueDiligenceChecklist ?? false,
                canManageDocumentPermissions: body.canManageDocumentPermissions ?? false,
                canViewGroupUsers: body.canViewGroupUsers ?? false,
                canManageUsers: body.canManageUsers ?? false,
                canViewGroupActivity: body.canViewGroupActivity ?? false,
            },
            include: {
                members: true,
            },
        });

        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json(
            { error: "Failed to create group" },
            { status: 500 }
        );
    }
}
