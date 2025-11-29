import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { validateFile, generateSecureStorageKey } from "@/lib/security/file-validation";
import { scanFile } from "@/lib/security/malware-scanner";
import { AuditService } from "@/lib/audit/audit-service";

// GET /api/documents - Get all documents for authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dataRoomId = searchParams.get("dataRoomId");
    const folderId = searchParams.get("folderId");

    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Build query - only show documents from data rooms where user is a member
    const where: any = {
      dataRoom: {
        groups: {
          some: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
    };

    if (dataRoomId) {
      where.dataRoomId = dataRoomId;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        owner: true,
        dataRoom: true,
        folder: true,
        _count: {
          select: {
            links: true,
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload a new document
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dataRoomId = formData.get("dataRoomId") as string;
    const folderId = formData.get("folderId") as string | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!file || !dataRoomId) {
      return NextResponse.json(
        { success: false, error: "File and dataRoomId are required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check data room membership
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: user.id,
        group: {
          dataRoomId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this data room" },
        { status: 403 }
      );
    }

    // Get data room settings for file upload limits
    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      select: {
        maxFileSize: true,
        allowedFileTypes: true,
      },
    });

    if (!dataRoom) {
      return NextResponse.json(
        { success: false, error: "Data room not found" },
        { status: 404 }
      );
    }

    // Convert file to buffer for validation and scanning
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Validate file (type, size, filename, MIME verification)
    const validation = await validateFile(file, fileBuffer, {
      maxSize: dataRoom.maxFileSize,
      customWhitelist: dataRoom.allowedFileTypes as string[] | undefined,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || "File validation failed" },
        { status: 400 }
      );
    }

    // Scan for malware
    const scanResult = await scanFile(fileBuffer, file.name);

    // Block infected files
    if (scanResult.status === 'infected') {
      console.warn(`[Security] Blocked infected file upload: ${file.name}`, scanResult);
      return NextResponse.json(
        { success: false, error: "File failed security scan and cannot be uploaded" },
        { status: 400 }
      );
    }

    // Upload file to storage with secure key
    const storage = getStorageProvider();
    const fileKey = generateSecureStorageKey(dataRoomId, validation.sanitizedFilename || file.name);

    const uploadResult = await storage.upload(fileKey, fileBuffer, {
      contentType: file.type,
      metadata: {
        originalName: encodeURIComponent(file.name),
        uploadedBy: user.id,
      },
    });

    // Create document record with scan status
    const document = await prisma.document.create({
      data: {
        name: name || (validation.sanitizedFilename || file.name),
        description,
        file: uploadResult.key,
        fileType: validation.detectedMimeType || file.type,
        fileSize: file.size,
        dataRoomId,
        ownerId: user.id,
        folderId: folderId || null,
        scanStatus: scanResult.status,
        scanResult: scanResult as any,
      },
      include: {
        owner: true,
        dataRoom: true,
        folder: true,
      },
    });

    // Log audit event
    await AuditService.log({
      dataRoomId,
      userId: user.id,
      action: "created",
      resourceType: "document",
      resourceId: document.id,
      metadata: {
        documentName: document.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
