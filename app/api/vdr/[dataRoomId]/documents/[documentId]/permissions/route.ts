import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
    params: Promise<{ dataRoomId: string; documentId: string }>;
}

// GET - Fetch document permissions
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, documentId } = await params;

        // Verify document exists and belongs to this data room
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                dataRoomId,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Fetch group permissions for this document
        const groupPermissions = await prisma.documentGroupPermission.findMany({
            where: {
                documentId,
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

        // Fetch user permissions for this document
        const userPermissions = await prisma.documentUserPermission.findMany({
            where: {
                documentId,
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
            documentId,
            documentName: document.name,
            groupPermissions,
            userPermissions,
        });
    } catch (error) {
        console.error("Error fetching document permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch document permissions" },
            { status: 500 }
        );
    }
}

// POST - Add new group permission to document
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, documentId } = await params;
        const body = await req.json();
        const { groupId, ...permissions } = body;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        // Verify document exists and belongs to this data room
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                dataRoomId,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
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
        const existing = await prisma.documentGroupPermission.findUnique({
            where: {
                documentId_groupId: {
                    documentId,
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
        const permission = await prisma.documentGroupPermission.create({
            data: {
                documentId,
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
        console.error("Error creating document permission:", error);
        return NextResponse.json(
            { error: "Failed to create document permission" },
            { status: 500 }
        );
    }
}

// PATCH - Update document permissions
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId, documentId } = await params;
        const body = await req.json();
        const { groupId, ...permissions } = body;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        // Verify document exists and belongs to this data room
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                dataRoomId,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Update or create the permission
        const permission = await prisma.documentGroupPermission.upsert({
            where: {
                documentId_groupId: {
                    documentId,
                    groupId,
                },
            },
            create: {
                documentId,
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
        console.error("Error updating document permission:", error);
        return NextResponse.json(
            { error: "Failed to update document permission" },
            { status: 500 }
        );
    }
}
