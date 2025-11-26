import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { NotificationService } from "@/lib/notifications/notification-service";

// GET /api/public/[slug] - Get link and document for public viewing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const link = await prisma.link.findUnique({
      where: { slug: slug },
      include: {
        document: {
          include: {
            owner: true,
            team: true,
          },
        },
        allowedEmails: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check if link is expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Link has expired" },
        { status: 410 }
      );
    }

    // Return link info (without password)
    const { password, ...linkData } = link;

    return NextResponse.json({
      success: true,
      data: {
        ...linkData,
        hasPassword: !!password,
      },
    });
  } catch (error) {
    console.error("Error fetching public link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/public/[slug] - Verify password and access document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { password, email, name } = body;

    const link = await prisma.link.findUnique({
      where: { slug: slug },
      include: {
        document: true,
        allowedEmails: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Link has expired" },
        { status: 410 }
      );
    }

    // Check password if required
    if (link.password && password) {
      const isValid = await bcrypt.compare(password, link.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Check email if email protected
    if (link.emailProtected && email) {
      const isAllowed = link.allowedEmails.some(
        (allowed: { email: string }) => allowed.email.toLowerCase() === email.toLowerCase()
      );

      if (!isAllowed) {
        return NextResponse.json(
          { success: false, error: "Email not authorized" },
          { status: 403 }
        );
      }
    }

    // Get client info
    const userAgent = request.headers.get("user-agent") || undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0] || undefined;

    // Create view record if tracking is enabled
    if (link.enableTracking) {
      const view = await prisma.view.create({
        data: {
          linkId: link.id,
          documentId: link.documentId,
          viewerEmail: email || null,
          viewerName: name || null,
          verified: link.emailAuthenticated && !!email,
          ipAddress,
          userAgent,
        },
      });

      // Send notification to link creator if enabled
      if (link.allowNotification) {
        try {
          await NotificationService.notifyLinkViewed({
            ownerId: link.createdBy,
            linkName: link.name || "Untitled Link",
            viewerEmail: email,
            documentName: link.document.name,
          });
        } catch (err) {
          console.error("Error sending view notification:", err);
        }
      }

      // Check for milestones
      const totalViews = await prisma.view.count({
        where: { linkId: link.id },
      });

      const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
      if (milestones.includes(totalViews)) {
        try {
          await NotificationService.notifyMilestoneReached({
            ownerId: link.createdBy,
            milestone: totalViews,
            documentName: link.document.name,
            linkName: link.name || "Untitled Link",
          });
        } catch (err) {
          console.error("Error sending milestone notification:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: link.documentId,
        documentName: link.document.name,
        allowDownload: link.allowDownload,
        enableFeedback: link.enableFeedback,
      },
    });
  } catch (error) {
    console.error("Error verifying access:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
