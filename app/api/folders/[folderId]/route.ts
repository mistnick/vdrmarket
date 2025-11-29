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
              dataRoomId: folder.dataRoomId,
            },
          },
        },
      },
    });

    if (!user || user.groupMemberships.length === 0) {
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

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check permissions (owner or admin)
    let user = null;
    for (const group of folder.dataRoom.groups) {
      const member = group.members.find(
        (m) => m.user.email === session.email
      );
      if (member) {
        user = member;
        break;
      }
    }

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const body = await request.json();

    // Validate index format if provided
    if (body.index !== undefined && body.index !== null) {
      const indexPattern = /^\d+(\.\d+)*$/;
      if (typeof body.index !== "string" || !indexPattern.test(body.index)) {
        return NextResponse.json(
          { error: "Invalid index format. Use numbers separated by dots (e.g., 1.2.3)" },
          { status: 400 }
        );
      }
    }

    // Get folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
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

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check permissions (owner or admin)
    let userMember = null;
    for (const group of folder.dataRoom.groups) {
      const member = group.members.find(
        (m) => m.user.email === session.email
      );
      if (member) {
        userMember = member;
        break;
      }
    }

    if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: { name?: string; index?: string | null; parentId?: string | null; dataRoomId?: string; path?: string } = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.index !== undefined) {
      updateData.index = body.index;
    }
    
    // Handle folder move (parentId change)
    if (body.parentId !== undefined) {
      updateData.parentId = body.parentId || null;
      
      // Recalculate path
      const folderName = body.name || folder.name;
      if (body.parentId) {
        const newParent = await prisma.folder.findUnique({
          where: { id: body.parentId },
        });
        if (newParent) {
          updateData.path = `${newParent.path}/${folderName}`;
        }
      } else {
        updateData.path = `/${folderName}`;
      }
    }
    
    // Handle dataRoom change
    if (body.dataRoomId !== undefined && body.dataRoomId !== folder.dataRoomId) {
      // Verify user has access to target data room
      const targetAccess = await prisma.groupMember.findFirst({
        where: {
          userId: userMember.userId,
          group: {
            dataRoomId: body.dataRoomId,
            type: "ADMINISTRATOR",
          },
        },
      });
      
      if (!targetAccess) {
        return NextResponse.json(
          { error: "No access to target data room" },
          { status: 403 }
        );
      }
      updateData.dataRoomId = body.dataRoomId;
    }

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: updateData,
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}
