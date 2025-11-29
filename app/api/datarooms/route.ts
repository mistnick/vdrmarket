import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

// Helper to get current tenant ID from cookie
async function getCurrentTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("current-tenant")?.value || null;
}

// Helper to validate user has access to tenant
async function validateTenantAccess(userId: string, tenantId: string): Promise<{ valid: boolean; tenantUser?: { role: string } }> {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: { tenantId, userId }
    },
    select: { role: true, status: true }
  });
  
  if (!tenantUser || tenantUser.status !== "ACTIVE") {
    return { valid: false };
  }
  
  return { valid: true, tenantUser: { role: tenantUser.role } };
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

    // Get current tenant ID
    const tenantId = await getCurrentTenantId();
    
    // Build where clause based on tenant context
    const whereClause: Record<string, unknown> = {
      groups: {
        some: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    };

    // If tenant is selected, filter by tenant
    if (tenantId) {
      // Validate user has access to this tenant
      const access = await validateTenantAccess(user.id, tenantId);
      if (!access.valid) {
        return NextResponse.json(
          { success: false, error: "Access denied to this tenant" },
          { status: 403 }
        );
      }
      whereClause.tenantId = tenantId;
    }

    // Find all data rooms where user is a member of any group
    const dataRooms = await prisma.dataRoom.findMany({
      where: whereClause,
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

    // Get current tenant ID
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "No tenant selected. Please select a tenant first." },
        { status: 400 }
      );
    }

    // Validate user has access to this tenant
    const access = await validateTenantAccess(user.id, tenantId);
    if (!access.valid) {
      return NextResponse.json(
        { success: false, error: "Access denied to this tenant" },
        { status: 403 }
      );
    }

    // Check tenant plan limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true }
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Tenant not found or inactive" },
        { status: 404 }
      );
    }

    // Check VDR limit
    if (tenant.plan && tenant.plan.maxVdr !== -1) {
      const currentVdrCount = await prisma.dataRoom.count({
        where: { tenantId }
      });
      
      if (currentVdrCount >= tenant.plan.maxVdr) {
        return NextResponse.json(
          { success: false, error: `VDR limit reached. Your plan allows maximum ${tenant.plan.maxVdr} data rooms.` },
          { status: 403 }
        );
      }
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

    // Get all TENANT_ADMIN users for this tenant
    const tenantAdmins = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        role: "TENANT_ADMIN",
        status: "ACTIVE",
      },
      select: { userId: true },
    });

    // Create data room with default Administrator group including ALL tenant admins
    const dataRoom = await prisma.dataRoom.create({
      data: {
        name,
        slug,
        description,
        isPublic,
        tenantId,
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
              create: tenantAdmins.map((admin, index) => ({
                userId: admin.userId,
                role: admin.userId === user.id ? "owner" : "admin",
              })),
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
