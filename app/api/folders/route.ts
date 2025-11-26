import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/folders - Get folders for a team
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
    const parentId = searchParams.get("parentId");

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "teamId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    // Check team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user?.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Not a member of this team" },
        { status: 403 }
      );
    }

    const folders = await prisma.folder.findMany({
      where: {
        teamId,
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
    const { name, teamId, parentId, dataRoomId } = body;

    if (!name || !teamId) {
      return NextResponse.json(
        { success: false, error: "name and teamId are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    // Check team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user?.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Not a member of this team" },
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
        teamId,
        ownerId: user!.id,
        parentId: parentId || null,
        dataRoomId: dataRoomId || null,
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
        teamId,
        userId: user!.id,
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
