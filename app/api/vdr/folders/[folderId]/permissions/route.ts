import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageDocumentPermissions } from "@/lib/vdr/authorization";
import {
    getFolderPermissions,
    setFolderGroupPermissions,
    setFolderUserPermissions,
} from "@/lib/vdr/document-permissions";

// GET /api/vdr/folders/[folderId]/permissions - Get folder permissions
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ folderId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { folderId } = await params;

        // Get folder to check data room
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            select: { dataRoomId: true },
        });

        if (!folder || !folder.dataRoomId) {
            return NextResponse.json({ error: "Folder not found or not in a data room" }, { status: 404 });
        }

        // Get all group permissions
        const groupPermissions = await prisma.folderGroupPermission.findMany({
            where: { folderId },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        // Get all user permissions
        const userPermissions = await prisma.folderUserPermission.findMany({
            where: { folderId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        // Get current user's effective permissions
        const effectivePermissions = await getFolderPermissions(user.id, folderId);

        return NextResponse.json({
            groupPermissions,
            userPermissions,
            effectivePermissions,
        });
    } catch (error) {
        console.error("Error fetching folder permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

// POST /api/vdr/folders/[folderId]/permissions - Set folder permissions
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ folderId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { folderId } = await params;

        // Get folder to check data room
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            select: { dataRoomId: true },
        });

        if (!folder || !folder.dataRoomId) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Check permission
        const canManage = await canManageDocumentPermissions(user.id, folder.dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to manage folder permissions" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { type, targetId, permissions } = body;

        if (!type || !targetId || !permissions) {
            return NextResponse.json(
                { error: "type, targetId, and permissions are required" },
                { status: 400 }
            );
        }

        if (type === "group") {
            await setFolderGroupPermissions(folderId, targetId, permissions);
        } else if (type === "user") {
            await setFolderUserPermissions(folderId, targetId, permissions);
        } else {
            return NextResponse.json(
                { error: "Invalid type" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Permissions updated successfully",
        });
    } catch (error) {
        console.error("Error setting folder permissions:", error);
        return NextResponse.json(
            { error: "Failed to set permissions" },
            { status: 500 }
        );
    }
}
