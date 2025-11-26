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

    // Get folder with relations
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        team: {
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
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check if user has access (team member)
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: {
          where: { teamId: folder.teamId },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check permissions (owner or admin)
    const user = folder.team.members.find(
      (m) => m.user.email === session.email
    );

    if (
      !user ||
      (user.role !== "owner" &&
        user.role !== "admin" &&
        folder.ownerId !== user.userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete folder (cascade will handle children)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
