import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ folderId: string }> }
) {
    try {
        const { folderId } = await params;
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { parentFolderId } = await req.json();

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get folder to verify ownership/access
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                team: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Check if user is member of the folder's team
        const isMember = folder.team?.members.some(
            (member) => member.userId === user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Prevent moving folder into itself
        if (parentFolderId === folderId) {
            return NextResponse.json(
                { error: "Cannot move folder into itself" },
                { status: 400 }
            );
        }

        // Prevent moving folder into its own descendants (circular reference)
        if (parentFolderId) {
            const isDescendant = await checkIfDescendant(folderId, parentFolderId);
            if (isDescendant) {
                return NextResponse.json(
                    { error: "Cannot move folder into its own descendant" },
                    { status: 400 }
                );
            }

            // Verify target folder belongs to the same team
            const targetFolder = await prisma.folder.findUnique({
                where: { id: parentFolderId },
            });

            if (!targetFolder || targetFolder.teamId !== folder.teamId) {
                return NextResponse.json(
                    { error: "Invalid target folder" },
                    { status: 400 }
                );
            }
        }

        // Update folder
        const updatedFolder = await prisma.folder.update({
            where: { id: folderId },
            data: { parentId: parentFolderId || null },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                teamId: folder.teamId,
                action: "FOLDER_MOVED",
                resourceType: "FOLDER",
                resourceId: folderId,
                metadata: {
                    fromParentId: folder.parentId,
                    toParentId: parentFolderId,
                },
            },
        });

        return NextResponse.json(updatedFolder);
    } catch (error) {
        console.error("Error moving folder:", error);
        return NextResponse.json(
            { error: "Failed to move folder" },
            { status: 500 }
        );
    }
}

// Helper function to check if targetId is a descendant of folderId
async function checkIfDescendant(folderId: string, targetId: string): Promise<boolean> {
    const targetFolder = await prisma.folder.findUnique({
        where: { id: targetId },
        select: { parentId: true },
    });

    if (!targetFolder) {
        return false;
    }

    if (targetFolder.parentId === folderId) {
        return true;
    }

    if (targetFolder.parentId) {
        return checkIfDescendant(folderId, targetFolder.parentId);
    }

    return false;
}
