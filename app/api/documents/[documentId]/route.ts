import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document with relations
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        dataRoom: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            links: true,
            views: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access (group member in same dataRoom)
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
          where: {
            group: {
              dataRoomId: document.dataRoomId,
            },
          },
        },
      },
    });

    if (!user || user.groupMemberships.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        dataRoom: {
          include: {
            groups: {
              include: {
                members: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check permissions (owner or admin)
    let user = null;
    for (const group of document.dataRoom.groups) {
      const member = group.members.find(
        (m) => m.user.email === session.email
      );
      if (member) {
        user = member;
        break;
      }
    }

    if (!user || (user.role !== "owner" && user.role !== "admin" && document.ownerId !== user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete document (cascade will handle related records)
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
