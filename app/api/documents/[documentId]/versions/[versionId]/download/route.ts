/**
 * Document Version Download API
 * GET /api/documents/[documentId]/versions/[versionId]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string; versionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const { documentId, versionId } = await params;

    // Verify user has access to document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: session.userId },
          {
            dataRoom: {
              team: {
                members: {
                  some: {
                    userId: session.userId,
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Documento non trovato" },
        { status: 404 }
      );
    }

    // Get version
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Versione non trovata" },
        { status: 404 }
      );
    }

    // Get storage provider and download file
    const storage = getStorageProvider();
    const fileBuffer = await storage.download(version.file);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId: session.userId,
        teamId: document.teamId,
        action: "DOCUMENT_VERSION_DOWNLOAD",
        resourceType: "document",
        resourceId: documentId,
        metadata: {
          versionId: version.id,
          versionNumber: version.versionNumber,
        },
      },
    });

    // Return file
    const fileName = `${document.name}_v${version.versionNumber}.${document.fileType}`;
    
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": version.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading document version:", error);
    return NextResponse.json(
      { error: "Errore nel download della versione" },
      { status: 500 }
    );
  }
}
