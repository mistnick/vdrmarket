import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/datarooms - Get all data rooms for a team
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

    const dataRooms = await prisma.dataRoom.findMany({
      where: {
        teamId,
      },
      include: {
        _count: {
          select: {
            documents: true,
            folders: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: dataRooms,
    });
  } catch (error) {
    console.error("Error fetching data rooms:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/datarooms - Create a new data room
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
    const { name, description, teamId, isPublic = false, permissions = [] } = body;

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

    // Create data room
    const dataRoom = await prisma.dataRoom.create({
      data: {
        name,
        description,
        teamId,
        isPublic,
        permissions: {
          create: permissions.map((p: { email: string; level: string }) => ({
            email: p.email,
            level: p.level,
          })),
        },
      },
      include: {
        permissions: true,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        teamId,
        userId: user!.id,
        action: "created",
        resourceType: "dataroom",
        resourceId: dataRoom.id,
        metadata: {
          dataRoomName: name,
          isPublic,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: dataRoom,
    });
  } catch (error) {
    console.error("Error creating data room:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
