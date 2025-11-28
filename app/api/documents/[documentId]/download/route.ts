/**
 * Document Download API
 * GET /api/documents/[documentId]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { nanoid } from "nanoid";
import { AuditService } from "@/lib/audit/audit-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const { documentId } = await params;

    // Verify user has access to document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: session.userId },
          {
            team: {
              members: {
                some: {
                  userId: session.userId,
                },
              },
            },
          },
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
        { error: "Documento non trovato o accesso negato" },
        { status: 404 }
      );
    }

    // Get storage provider and download file
    const storage = getStorageProvider();
    const fileBuffer = await storage.download(document.file);

    // Create audit log
    await AuditService.log({
      userId: session.userId,
      teamId: document.teamId,
      action: "downloaded",
      resourceType: "document",
      resourceId: documentId,
      metadata: {
        fileName: document.name,
        fileSize: document.fileSize,
      },
    });

    // Determine content type
    const contentType = document.fileType || "application/octet-stream";

    // Get file extension from name or fileType
    const getExtension = (name: string, mimeType: string): string => {
      const nameParts = name.split(".");
      if (nameParts.length > 1) return nameParts[nameParts.length - 1];

      // Fallback to mime type
      const mimeExtensions: Record<string, string> = {
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/vnd.ms-powerpoint": "ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "text/plain": "txt",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
      };

      return mimeExtensions[mimeType] || "bin";
    };

    const fileName = document.name.includes(".")
      ? document.name
      : `${document.name}.${getExtension(document.name, document.fileType)}`;

    // Return file
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Errore nel download del documento" },
      { status: 500 }
    );
  }
}
