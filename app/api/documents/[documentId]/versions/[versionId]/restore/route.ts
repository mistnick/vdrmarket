import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { createAuditLog } from "@/lib/auth/audit-logger";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ documentId: string; versionId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId, versionId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get document and version
    const [document, sourceVersion] = await Promise.all([
      prisma.document.findUnique({
        where: { id: documentId },
        include: {
          team: {
            include: {
              members: {
                where: { userId: user.id },
              },
            },
          },
        },
      }),
      prisma.documentVersion.findUnique({
        where: { id: versionId },
      }),
    ]);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!sourceVersion || sourceVersion.documentId !== documentId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (document.team.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get next version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version from source version (rollback)
    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        file: sourceVersion.file, // Use same file as source version
        fileSize: sourceVersion.fileSize,
        fileName: sourceVersion.fileName,
        fileType: sourceVersion.fileType,
        comment: `Restored from version ${sourceVersion.versionNumber}`,
        metadata: {
          restoredFrom: sourceVersion.id,
          restoredFromVersion: sourceVersion.versionNumber,
        },
        createdById: user.id,
      },
    });

    // Update document to point to restored version
    await prisma.document.update({
      where: { id: documentId },
      data: {
        versions: nextVersionNumber,
        file: sourceVersion.file,
        fileSize: sourceVersion.fileSize,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      action: "DOCUMENT_UPDATED",
      resourceType: "document",
      resourceId: documentId,
      userId: user.id,
      teamId: document.teamId,
      metadata: {
        action: "version_restored",
        restoredFromVersion: sourceVersion.versionNumber,
        newVersion: nextVersionNumber,
      },
      request,
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Error restoring document version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
