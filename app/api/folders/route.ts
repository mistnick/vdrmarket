import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/folders - Get folders for a data room
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
    const parentId = searchParams.get("parentId");

    if (!dataRoomId) {
      return NextResponse.json(
        { success: false, error: "dataRoomId is required" },
        { status: 400 }
      );
    }

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
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this data room" },
        { status: 403 }
      );
    }

    const folders = await prisma.folder.findMany({
      where: {
        dataRoomId,
        parentId: parentId || null,
      },
      include: {
        owner: true,
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, dataRoomId, parentId } = body;

    if (!name || !dataRoomId) {
      return NextResponse.json(
        { success: false, error: "name and dataRoomId are required" },
        { status: 400 }
      );
    }

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
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this data room" },
        { status: 403 }
      );
    }

    // Calculate path
    let path = `/${name}`;
    if (parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent folder not found" },
          { status: 404 }
        );
      }

      path = `${parent.path}/${name}`;
    }

    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name,
        dataRoomId,
        ownerId: user.id,
        parentId: parentId || null,
        path,
      },
      include: {
        owner: true,
        parent: true,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        dataRoomId,
        userId: user.id,
        action: "created",
        resourceType: "folder",
        resourceId: folder.id,
        metadata: {
          folderName: name,
          path,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
