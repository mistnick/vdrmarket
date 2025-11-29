import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageDocumentPermissions } from "@/lib/vdr/authorization";
import {
    getDocumentPermissions,
    setDocumentGroupPermissions,
    setDocumentUserPermissions,
    removeDocumentGroupPermissions,
    removeDocumentUserPermissions,
} from "@/lib/vdr/document-permissions";

// GET /api/vdr/documents/[documentId]/permissions - Get document permissions
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get document to check data room
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { dataRoomId: true },
        });

        if (!document || !document.dataRoomId) {
            return NextResponse.json({ error: "Document not found or not in a data room" }, { status: 404 });
        }

        // Get all group permissions
        const groupPermissions = await prisma.documentGroupPermission.findMany({
            where: { documentId },
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
        const userPermissions = await prisma.documentUserPermission.findMany({
            where: { documentId },
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
        const effectivePermissions = await getDocumentPermissions(user.id, documentId);

        return NextResponse.json({
            groupPermissions,
            userPermissions,
            effectivePermissions,
        });
    } catch (error) {
        console.error("Error fetching document permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

// POST /api/vdr/documents/[documentId]/permissions - Set document permissions
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get document to check data room
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { dataRoomId: true },
        });

        if (!document || !document.dataRoomId) {
            return NextResponse.json({ error: "Document not found or not in a data room" }, { status: 404 });
        }

        // Check permission to manage document permissions
        const canManage = await canManageDocumentPermissions(user.id, document.dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to manage document permissions" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { type, targetId, permissions } = body;

        // Validate input
        if (!type || !targetId || !permissions) {
            return NextResponse.json(
                { error: "type, targetId, and permissions are required" },
                { status: 400 }
            );
        }

        if (type === "group") {
            await setDocumentGroupPermissions(documentId, targetId, permissions);
        } else if (type === "user") {
            await setDocumentUserPermissions(documentId, targetId, permissions);
        } else {
            return NextResponse.json(
                { error: "Invalid type. Must be 'group' or 'user'" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Permissions updated successfully",
        });
    } catch (error) {
        console.error("Error setting document permissions:", error);
        return NextResponse.json(
            { error: "Failed to set permissions" },
            { status: 500 }
        );
    }
}

// DELETE /api/vdr/documents/[documentId]/permissions - Remove document permissions
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get document to check data room
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { dataRoomId: true },
        });

        if (!document || !document.dataRoomId) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Check permission
        const canManage = await canManageDocumentPermissions(user.id, document.dataRoomId);
        if (!canManage) {
            return NextResponse.json(
                { error: "You do not have permission to manage document permissions" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const targetId = searchParams.get("targetId");

        if (!type || !targetId) {
            return NextResponse.json(
                { error: "type and targetId query parameters are required" },
                { status: 400 }
            );
        }

        if (type === "group") {
            await removeDocumentGroupPermissions(documentId, targetId);
        } else if (type === "user") {
            await removeDocumentUserPermissions(documentId, targetId);
        } else {
            return NextResponse.json(
                { error: "Invalid type" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Permissions removed successfully",
        });
    } catch (error) {
        console.error("Error removing document permissions:", error);
        return NextResponse.json(
            { error: "Failed to remove permissions" },
            { status: 500 }
        );
    }
}
