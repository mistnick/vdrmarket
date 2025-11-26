import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id]/permissions - List permissions
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

        // Check access to data room
        const dataRoom = await prisma.dataRoom.findFirst({
            where: {
                id,
                team: {
                    members: {
                        some: {
                            userId: user?.id,
                        },
                    },
                },
            },
        });

        if (!dataRoom) {
            return NextResponse.json(
                { success: false, error: "Data room not found or access denied" },
                { status: 404 }
            );
        }

        const permissions = await prisma.dataRoomPermission.findMany({
            where: {
                dataRoomId: id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            data: permissions,
        });
    } catch (error) {
        console.error("Error fetching permissions:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/datarooms/[id]/permissions - Add permission
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
        const { email, level = "viewer" } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check access (only admins/owners can add permissions)
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

        // Create permission
        const permission = await prisma.dataRoomPermission.create({
            data: {
                dataRoomId: id,
                email,
                level,
            },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                teamId: dataRoom.teamId,
                userId: user!.id,
                action: "created",
                resourceType: "permission",
                resourceId: permission.id,
                metadata: {
                    email,
                    level,
                    dataRoomId: id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: permission,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Permission already exists for this email" },
                { status: 400 }
            );
        }
        console.error("Error adding permission:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
