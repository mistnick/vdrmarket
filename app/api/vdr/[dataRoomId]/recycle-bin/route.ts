import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessRecycleBin } from "@/lib/vdr/authorization";

// GET /api/vdr/[dataRoomId]/recycle-bin - List deleted items (admin only)
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

        // Check permission (only administrators)
        const canAccess = await canAccessRecycleBin(user.id, dataRoomId);
        if (!canAccess) {
            return NextResponse.json(
                { error: "You do not have permission to access the recycle bin" },
                { status: 403 }
            );
        }

        // Get deleted documents
        const deletedDocuments = await prisma.document.findMany({
            where: {
                dataRoomId,
                deletedAt: {
                    not: null,
                },
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
                        path: true,
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });

        // Get deleted folders
        const deletedFolders = await prisma.folder.findMany({
            where: {
                dataRoomId,
                deletedAt: {
                    not: null,
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        name: true,
                        path: true,
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });

        return NextResponse.json({
            documents: deletedDocuments,
            folders: deletedFolders,
        });
    } catch (error) {
        console.error("Error fetching recycle bin:", error);
        return NextResponse.json(
            { error: "Failed to fetch recycle bin" },
            { status: 500 }
        );
    }
}
