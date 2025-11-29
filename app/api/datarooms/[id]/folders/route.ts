import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id]/folders - List folders in data room
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

        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get("parentId");

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check access to data room via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user?.id,
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

        // Get folders in this data room
        const folders = await prisma.folder.findMany({
            where: {
                dataRoomId: id,
                ...(parentId ? { parentId } : { parentId: null }),
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        documents: true,
                        children: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            data: folders,
        });
    } catch (error) {
        console.error("Error fetching data room folders:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/datarooms/[id]/folders - Create folder in data room
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
        const { name, parentId } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "Name is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Check access to data room via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user?.id,
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

        // Get parent path if exists
        let path = `/${name}`;
        if (parentId) {
            const parent = await prisma.folder.findUnique({
                where: { id: parentId },
            });
            if (parent) {
                path = `${parent.path}/${name}`;
            }
        }

        // Create folder
        const folder = await prisma.folder.create({
            data: {
                name,
                ownerId: user!.id,
                parentId: parentId || null,
                dataRoomId: id,
                path,
            },
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true,
                    },
                },
            },
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                dataRoomId: id,
                userId: user!.id,
                action: "created",
                resourceType: "folder",
                resourceId: folder.id,
                metadata: {
                    folderName: name,
                    dataRoomId: id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: folder,
        });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
