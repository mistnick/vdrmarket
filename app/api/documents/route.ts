import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";

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
    const teamId = searchParams.get("teamId");
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

    const where: any = {
      team: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    };

    if (teamId) {
      where.teamId = teamId;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        owner: true,
        team: true,
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
    const teamId = formData.get("teamId") as string;
    const folderId = formData.get("folderId") as string | null;
    const dataRoomId = formData.get("dataRoomId") as string | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!file || !teamId) {
      return NextResponse.json(
        { success: false, error: "File and teamId are required" },
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

    // Check team membership
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Not a member of this team" },
        { status: 403 }
      );
    }

    // Upload file to storage
    const storage = getStorageProvider();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `${teamId}/${Date.now()}-${file.name}`;

    const uploadResult = await storage.upload(fileKey, fileBuffer, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: user.id,
      },
    });

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: name || file.name,
        description,
        file: uploadResult.key,
        fileType: file.type,
        fileSize: file.size,
        teamId,
        ownerId: user.id,
        folderId: folderId || null,
        dataRoomId: dataRoomId || null,
      },
      include: {
        owner: true,
        team: true,
        folder: true,
        dataRoom: true,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        teamId,
        userId: user.id,
        action: "created",
        resourceType: "document",
        resourceId: document.id,
        metadata: {
          documentName: document.name,
          fileSize: file.size,
          fileType: file.type,
        },
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
