import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { createAuditLog } from "@/lib/auth/audit-logger";
import { validateFile } from "@/lib/security/file-validation";
import { scanFile } from "@/lib/security/malware-scanner";

// Route segment config for large file uploads
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document to check access via GroupMember
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: session.userId },
          {
            dataRoom: {
              groups: {
                some: {
                  members: {
                    some: {
                      userId: session.userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Fetch all versions
    const versions = await prisma.documentVersion.findMany({
      where: {
        documentId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        versionNumber: "desc",
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching document versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document to check access via GroupMember with edit permissions (ADMINISTRATOR group type)
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: session.userId },
          {
            dataRoom: {
              groups: {
                some: {
                  type: "ADMINISTRATOR",
                  members: {
                    some: {
                      userId: session.userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        dataRoom: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const comment = formData.get("comment") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get data room for security settings
    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: document.dataRoomId },
      select: { maxFileSize: true, allowedFileTypes: true },
    });

    if (!dataRoom) {
      return NextResponse.json({ error: "DataRoom not found" }, { status: 404 });
    }

    // Validate file
    const validation = await validateFile(file, buffer, {
      maxSize: dataRoom.maxFileSize,
      customWhitelist: dataRoom.allowedFileTypes as string[] | undefined,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "File validation failed" },
        { status: 400 }
      );
    }

    // Scan for malware
    const scanResult = await scanFile(buffer, file.name);

    if (scanResult.status === 'infected') {
      console.warn(`[Security] Blocked infected version upload: ${file.name}`, scanResult);
      return NextResponse.json(
        { error: "File failed security scan and cannot be uploaded" },
        { status: 400 }
      );
    }

    // Generate unique key for version
    const timestamp = Date.now();
    const fileKey = `datarooms/${document.dataRoomId}/documents/${documentId}/versions/${timestamp}-${file.name}`;

    // Upload new file version using storage provider
    const storageProvider = getStorageProvider();
    const uploadResult = await storageProvider.upload(fileKey, buffer, {
      contentType: file.type,
      metadata: {
        documentId,
        originalName: file.name,
        uploadedBy: session.userId,
      },
    });

    // Get next version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version
    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        file: uploadResult.key,
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        comment: comment || null,
        createdById: session.userId,
      },
    });

    // Update document's version count and file reference
    await prisma.document.update({
      where: { id: documentId },
      data: {
        versions: nextVersionNumber,
        file: uploadResult.key,
        fileSize: file.size,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      action: "DOCUMENT_UPDATED",
      resourceType: "document",
      resourceId: documentId,
      userId: session.userId,
      dataRoomId: document.dataRoomId,
      metadata: {
        versionNumber: nextVersionNumber,
        comment: comment || undefined,
        fileName: file.name,
      },
      request,
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Error creating document version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
