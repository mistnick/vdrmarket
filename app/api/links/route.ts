import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateSecureToken } from "@/lib/security/token";
import bcrypt from "bcryptjs";
import { sendDocumentSharedEmail } from "@/lib/email/service";
import { AuditService } from "@/lib/audit/audit-service";

// GET /api/links - Get all links for a document
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const dataRoomId = searchParams.get("dataRoomId");

    let where: any = {};

    if (documentId) {
      // Check if user has access to the document via GroupMember
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          dataRoom: {
            groups: {
              some: {
                members: {
                  some: {
                    userId: session.userId,
                  },
                },
              },
            },
          },
        },
      });

      if (!document) {
        return NextResponse.json(
          { success: false, error: "Document not found or access denied" },
          { status: 404 }
        );
      }
      where.documentId = documentId;
    } else {
      // Get all links for documents the user has access to
      // Optionally filter by dataRoomId if provided
      where.document = {
        dataRoom: {
          groups: {
            some: {
              members: {
                some: {
                  userId: session.userId,
                },
              },
            },
          },
          ...(dataRoomId ? { id: dataRoomId } : {}),
        },
      };
    }

    const links = await prisma.link.findMany({
      where,
      include: {
        creator: true,
        document: true,
        _count: {
          select: {
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/links - Create a new share link
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      documentId,
      name,
      description,
      password,
      expiresAt,
      allowDownload = true,
      allowNotification = true,
      emailProtected = false,
      emailAuthenticated = false,
      enableTracking = true,
      enableFeedback = false,
      allowedEmails = [],
      maxViews, // New: max number of views
      allowedDomains, // New: array of allowed email domains
    } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "documentId is required" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check document access via GroupMember
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dataRoom: {
          groups: {
            some: {
              members: {
                some: {
                  userId: session.userId,
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Generate secure 128-bit token (22 characters)
    const slug = generateSecureToken();

    // Hash password if provided
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    // Set default expiration to 7 days if not provided
    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 7);
    const finalExpiresAt = expiresAt ? new Date(expiresAt) : defaultExpiresAt;

    // Validate and process allowedDomains
    let domainsJson = null;
    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      // Basic domain validation
      const validDomains = allowedDomains.filter((domain: string) => {
        return typeof domain === 'string' && domain.trim().length > 0;
      });
      if (validDomains.length > 0) {
        domainsJson = validDomains;
      }
    }

    // Create link
    const link = await prisma.link.create({
      data: {
        slug,
        documentId,
        createdBy: session.userId,
        name,
        description,
        password: hashedPassword,
        expiresAt: finalExpiresAt,
        allowDownload,
        allowNotification,
        emailProtected,
        emailAuthenticated,
        enableTracking,
        enableFeedback,
        maxViews: maxViews || null,
        viewCount: 0,
        allowedDomains: domainsJson as any,
        allowedEmails: {
          create: allowedEmails.map((email: string) => ({
            email,
          })),
        },
      },
      include: {
        creator: true,
        document: true,
        allowedEmails: true,
      },
    });

    // Log audit event
    await AuditService.log({
      dataRoomId: document.dataRoomId,
      userId: session.userId,
      action: "shared",
      resourceType: "link",
      resourceId: link.id,
      metadata: {
        linkSlug: slug,
        documentId,
        documentName: document.name,
        hasPassword: !!password,
        expiresAt,
      },
    });

    // Send email notifications to allowed emails (if configured)
    if (allowedEmails && allowedEmails.length > 0) {
      const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/view/${slug}`;

      for (const email of allowedEmails) {
        try {
          await sendDocumentSharedEmail({
            to: email,
            recipientName: email.split('@')[0], // Use email prefix as name fallback
            senderName: user.name || user.email,
            documentName: document.name,
            link: linkUrl,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          });

          console.log(`✅ Document share email sent to ${email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${email}:`, emailError);
          // Continue with other emails even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
