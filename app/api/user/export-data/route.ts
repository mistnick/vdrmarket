import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, apiLimiter } from "@/lib/rate-limit";

/**
 * GDPR Data Export Endpoint
 * Exports all user data in JSON format
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiLimiter, 5);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    // Authentication
    const session = await getSession();
    if (!session || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        accounts: true,
        teams: {
          include: {
            team: {
              include: {
                _count: {
                  select: {
                    documents: true,
                    folders: true,
                    dataRooms: true,
                    members: true,
                  },
                },
              },
            },
          },
        },
        documents: {
          include: {
            _count: {
              select: {
                views: true,
                links: true,
              },
            },
          },
        },
        folders: true,
        links: {
          include: {
            _count: {
              select: {
                views: true,
              },
            },
          },
        },
        views: true,
        notifications: true,
        auditLogs: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DATA_EXPORT",
        resourceType: "USER",
        resourceId: session.userId,
        metadata: {
          exportDate: new Date().toISOString(),
        },
      },
    });

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      accounts: userData.accounts.map((acc) => ({
        provider: acc.provider,
        providerAccountId: acc.providerAccountId,
        type: acc.type,
      })),
      teams: userData.teams.map((tm) => ({
        role: tm.role,
        team: {
          name: tm.team.name,
          slug: tm.team.slug,
          plan: tm.team.plan,
          statistics: tm.team._count,
        },
      })),
      documents: userData.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        file: doc.file,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        statistics: doc._count,
      })),
      folders: userData.folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
      })),
      links: userData.links.map((link) => ({
        id: link.id,
        slug: link.slug,
        name: link.name,
        password: link.password ? "***" : null,
        emailProtected: link.emailProtected,
        emailAuthenticated: link.emailAuthenticated,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        statistics: link._count,
      })),
      views: userData.views.map((view) => ({
        id: view.id,
        viewedAt: view.viewedAt,
        duration: view.duration,
        completionRate: view.completionRate,
      })),
      notifications: userData.notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        createdAt: notif.createdAt,
      })),
      auditLogs: userData.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        createdAt: log.createdAt,
      })),
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="dataroom-export-${session.userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
