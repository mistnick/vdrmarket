import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
    params: Promise<{ dataRoomId: string; folderId: string }>;
}

// GET - Fetch folder permissions
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, folderId } = await params;

        // Verify folder exists and belongs to this data room
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                dataRoomId,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Fetch group permissions for this folder
        const groupPermissions = await prisma.folderGroupPermission.findMany({
            where: {
                folderId,
            },
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

        // Fetch user permissions for this folder
        const userPermissions = await prisma.folderUserPermission.findMany({
            where: {
                folderId,
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
            folderId,
            folderName: folder.name,
            groupPermissions,
            userPermissions,
        });
    } catch (error) {
        console.error("Error fetching folder permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch folder permissions" },
            { status: 500 }
        );
    }
}

// POST - Add new group permission to folder
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, folderId } = await params;
        const body = await req.json();
        const { groupId, ...permissions } = body;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        // Verify folder exists and belongs to this data room
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                dataRoomId,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Verify group exists and belongs to this data room
        const group = await prisma.group.findFirst({
            where: {
                id: groupId,
                dataRoomId,
            },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Check if permission already exists
        const existing = await prisma.folderGroupPermission.findUnique({
            where: {
                folderId_groupId: {
                    folderId,
                    groupId,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Permission already exists for this group" },
                { status: 400 }
            );
        }

        // Create the permission
        const permission = await prisma.folderGroupPermission.create({
            data: {
                folderId,
                groupId,
                canFence: permissions.canFence ?? false,
                canView: permissions.canView ?? true,
                canDownloadEncrypted: permissions.canDownloadEncrypted ?? false,
                canDownloadPdf: permissions.canDownloadPdf ?? false,
                canDownloadOriginal: permissions.canDownloadOriginal ?? false,
                canUpload: permissions.canUpload ?? false,
                canManage: permissions.canManage ?? false,
            },
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

        return NextResponse.json(permission, { status: 201 });
    } catch (error) {
        console.error("Error creating folder permission:", error);
        return NextResponse.json(
            { error: "Failed to create folder permission" },
            { status: 500 }
        );
    }
}

// PATCH - Update folder permissions
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, folderId } = await params;
        const body = await req.json();
        const { groupId, ...permissions } = body;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        // Verify folder exists and belongs to this data room
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                dataRoomId,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Update or create the permission
        const permission = await prisma.folderGroupPermission.upsert({
            where: {
                folderId_groupId: {
                    folderId,
                    groupId,
                },
            },
            create: {
                folderId,
                groupId,
                canFence: permissions.canFence ?? false,
                canView: permissions.canView ?? true,
                canDownloadEncrypted: permissions.canDownloadEncrypted ?? false,
                canDownloadPdf: permissions.canDownloadPdf ?? false,
                canDownloadOriginal: permissions.canDownloadOriginal ?? false,
                canUpload: permissions.canUpload ?? false,
                canManage: permissions.canManage ?? false,
            },
            update: permissions,
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

        return NextResponse.json(permission);
    } catch (error) {
        console.error("Error updating folder permission:", error);
        return NextResponse.json(
            { error: "Failed to update folder permission" },
            { status: 500 }
        );
    }
}
