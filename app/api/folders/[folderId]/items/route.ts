import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;

    // Get folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check access
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
          where: {
            group: {
              dataRoomId: folder.dataRoomId,
            },
          },
        },
      },
    });

    if (!user || user.groupMemberships.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get subfolders
    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get documents
    const documents = await prisma.document.findMany({
      where: { folderId },
      select: {
        id: true,
        name: true,
        fileSize: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Combine and format items
    const items = [
      ...subfolders.map((f) => ({
        id: f.id,
        name: f.name,
        type: "folder" as const,
        createdAt: f.createdAt.toISOString(),
        owner: f.owner,
      })),
      ...documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: "document" as const,
        size: d.fileSize,
        createdAt: d.createdAt.toISOString(),
        owner: d.owner,
      })),
    ];

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching folder items:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder items" },
      { status: 500 }
    );
  }
}
