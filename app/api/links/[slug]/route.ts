import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

// GET /api/links/[slug] - Get link details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const link = await prisma.link.findUnique({
      where: { slug: slug },
      include: {
        document: {
          include: {
            dataRoom: true,
          },
        },
        creator: true,
        allowedEmails: true,
        _count: {
          select: {
            views: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check access via GroupMember
    const hasAccess = await prisma.groupMember.findFirst({
      where: {
        userId: session.userId,
        group: {
          dataRoomId: link.document.dataRoomId,
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/links/[slug] - Update link
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      password,
      expiresAt,
      allowDownload,
      allowNotification,
      emailProtected,
      emailAuthenticated,
      enableTracking,
      enableFeedback,
      allowedEmails,
    } = body;

    const link = await prisma.link.findUnique({
      where: { slug: slug },
      include: {
        document: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check access via GroupMember with edit permissions (ADMINISTRATOR group type)
    const hasAccess = await prisma.groupMember.findFirst({
      where: {
        userId: session.userId,
        group: {
          dataRoomId: link.document.dataRoomId,
          type: "ADMINISTRATOR",
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Update data
    const updateData: any = {
      name,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      allowDownload,
      allowNotification,
      emailProtected,
      emailAuthenticated,
      enableTracking,
      enableFeedback,
    };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update link
    const updatedLink = await prisma.link.update({
      where: { slug: slug },
      data: updateData,
      include: {
        document: true,
        creator: true,
        allowedEmails: true,
      },
    });

    // Update allowed emails if provided
    if (allowedEmails) {
      await prisma.linkAllowedEmail.deleteMany({
        where: { linkId: updatedLink.id },
      });

      await prisma.linkAllowedEmail.createMany({
        data: allowedEmails.map((email: string) => ({
          linkId: updatedLink.id,
          email,
        })),
      });
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        dataRoomId: link.document.dataRoomId,
        userId: session.userId,
        action: "updated",
        resourceType: "link",
        resourceId: link.id,
        metadata: {
          linkSlug: slug,
          changes: body,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLink,
    });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/links/[slug] - Delete link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const link = await prisma.link.findUnique({
      where: { slug: slug },
      include: {
        document: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check access via GroupMember with delete permissions (ADMINISTRATOR group type)
    const hasAccess = await prisma.groupMember.findFirst({
      where: {
        userId: session.userId,
        group: {
          dataRoomId: link.document.dataRoomId,
          type: "ADMINISTRATOR",
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete link
    await prisma.link.delete({
      where: { slug: slug },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        dataRoomId: link.document.dataRoomId,
        userId: session.userId,
        action: "deleted",
        resourceType: "link",
        resourceId: link.id,
        metadata: {
          linkSlug: slug,
          documentId: link.documentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
