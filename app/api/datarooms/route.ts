import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { GroupType } from "@prisma/client";

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
}

// GET /api/datarooms - Get all data rooms for authenticated user
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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

    // Find all data rooms where user is a member of any group
    const dataRooms = await prisma.dataRoom.findMany({
      where: {
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
      include: {
        groups: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isActive: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
            folders: true,
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
    const { name, description, isPublic = false, slug: customSlug } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "name is required" },
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

    // Generate or validate slug
    const slug = customSlug || generateSlug(name);
    
    // Check if slug is already taken
    const existingDataRoom = await prisma.dataRoom.findUnique({
      where: { slug },
    });

    if (existingDataRoom) {
      return NextResponse.json(
        { success: false, error: "Slug already taken" },
        { status: 400 }
      );
    }

    // Create data room with default Administrator group
    const dataRoom = await prisma.dataRoom.create({
      data: {
        name,
        slug,
        description,
        isPublic,
        groups: {
          create: {
            name: "Administrators",
            description: "Default administrator group",
            type: GroupType.ADMINISTRATOR,
            canViewDueDiligenceChecklist: true,
            canManageDocumentPermissions: true,
            canViewGroupUsers: true,
            canManageUsers: true,
            canViewGroupActivity: true,
            members: {
              create: {
                userId: user.id,
                role: "owner",
              },
            },
          },
        },
      },
      include: {
        groups: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        dataRoomId: dataRoom.id,
        userId: user.id,
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
