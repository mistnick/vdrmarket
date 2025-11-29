/**
 * Bulk Delete API
 * DELETE /api/bulk-delete
 * 
 * Deletes multiple documents and/or folders at once.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { nanoid } from "nanoid";

interface BulkDeleteRequest {
  documentIds?: string[];
  folderIds?: string[];
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const body: BulkDeleteRequest = await request.json();
    const { documentIds = [], folderIds = [] } = body;

    if (documentIds.length === 0 && folderIds.length === 0) {
      return NextResponse.json(
        { error: "Nessun elemento selezionato" },
        { status: 400 }
      );
    }

    const results = {
      documentsDeleted: 0,
      foldersDeleted: 0,
      errors: [] as string[],
    };

    // Get user with their group memberships
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                dataRoom: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    // Helper to check if user can delete
    const canDelete = (
      itemOwnerId: string | null,
      dataRoomId: string,
      userGroupMemberships: typeof user.groupMemberships
    ): boolean => {
      const groupMembership = userGroupMemberships.find((gm) => gm.group.dataRoomId === dataRoomId);
      if (!groupMembership) return false;

      // Owner or admin can delete anything
      if (groupMembership.role === "owner" || groupMembership.role === "admin") {
        return true;
      }

      // Regular members can only delete their own items
      return itemOwnerId === session.userId;
    };

    // Delete documents
    for (const docId of documentIds) {
      try {
        const document = await prisma.document.findUnique({
          where: { id: docId },
          select: {
            id: true,
            name: true,
            ownerId: true,
            dataRoomId: true,
          },
        });

        if (!document) {
          results.errors.push(`Documento ${docId} non trovato`);
          continue;
        }

        if (!canDelete(document.ownerId, document.dataRoomId, user.groupMemberships)) {
          results.errors.push(`Permesso negato per documento "${document.name}"`);
          continue;
        }

        await prisma.document.delete({
          where: { id: docId },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            id: nanoid(),
            userId: session.userId,
            dataRoomId: document.dataRoomId,
            action: "DOCUMENT_DELETE",
            resourceType: "document",
            resourceId: docId,
            metadata: {
              documentName: document.name,
              bulkDelete: true,
            },
          },
        });

        results.documentsDeleted++;
      } catch (err) {
        console.error(`Error deleting document ${docId}:`, err);
        results.errors.push(`Errore eliminazione documento ${docId}`);
      }
    }

    // Delete folders (and their contents via cascade)
    for (const folderId of folderIds) {
      try {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
          select: {
            id: true,
            name: true,
            ownerId: true,
            dataRoomId: true,
            _count: {
              select: {
                documents: true,
                children: true,
              },
            },
          },
        });

        if (!folder) {
          results.errors.push(`Cartella ${folderId} non trovata`);
          continue;
        }

        if (!canDelete(folder.ownerId, folder.dataRoomId, user.groupMemberships)) {
          results.errors.push(`Permesso negato per cartella "${folder.name}"`);
          continue;
        }

        await prisma.folder.delete({
          where: { id: folderId },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            id: nanoid(),
            userId: session.userId,
            dataRoomId: folder.dataRoomId,
            action: "FOLDER_DELETE",
            resourceType: "folder",
            resourceId: folderId,
            metadata: {
              folderName: folder.name,
              documentsCount: folder._count.documents,
              childrenCount: folder._count.children,
              bulkDelete: true,
            },
          },
        });

        results.foldersDeleted++;
      } catch (err) {
        console.error(`Error deleting folder ${folderId}:`, err);
        results.errors.push(`Errore eliminazione cartella ${folderId}`);
      }
    }

    const totalDeleted = results.documentsDeleted + results.foldersDeleted;

    if (totalDeleted === 0 && results.errors.length > 0) {
      return NextResponse.json(
        { 
          error: "Nessun elemento eliminato",
          details: results.errors,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Eliminati ${results.documentsDeleted} documenti e ${results.foldersDeleted} cartelle`,
      ...results,
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione" },
      { status: 500 }
    );
  }
}
