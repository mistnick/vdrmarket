import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms/[id]/documents - List documents in data room
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
        const folderId = searchParams.get("folderId");

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

        // Get documents in this data room
        const documents = await prisma.document.findMany({
            where: {
                dataRoomId: id,
                ...(folderId ? { folderId } : { folderId: null }),
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                folder: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        links: true,
                        views: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            data: documents,
        });
    } catch (error) {
        console.error("Error fetching data room documents:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
