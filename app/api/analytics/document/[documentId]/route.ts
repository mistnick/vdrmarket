import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/analytics/document/[documentId] - Get analytics for a document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    // Check document access via GroupMember
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dataRoom: {
          groups: {
            some: {
              members: {
                some: {
                  userId: user?.id,
                },
              },
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            links: true,
            views: true,
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

    // Get all views for the document
    const views = await prisma.view.findMany({
      where: {
        documentId: documentId,
      },
      orderBy: {
        viewedAt: "desc",
      },
    });

    // Calculate metrics
    const totalViews = views.length;
    const uniqueViewers = new Set(
      views.map((v: any) => v.viewerEmail || v.ipAddress).filter(Boolean)
    ).size;

    const avgDuration =
      views.reduce((sum: number, v: any) => sum + (v.duration || 0), 0) / totalViews || 0;

    const avgCompletionRate =
      views.reduce((sum: number, v: any) => sum + (v.completionRate || 0), 0) /
      totalViews || 0;

    // Views by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDate = views
      .filter((v: any) => v.viewedAt >= thirtyDaysAgo)
      .reduce((acc: { [key: string]: number }, view: any) => {
        const date = view.viewedAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    const viewsByDateArray = Object.entries(viewsByDate).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    // Views by country
    const viewersByCountry = views.reduce(
      (acc: { [key: string]: number }, view: any) => {
        const country = view.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {}
    );

    const viewersByCountryArray = Object.entries(viewersByCountry).map(
      ([country, count]) => ({
        country,
        count: count as number,
      })
    );

    // Total downloads
    const totalDownloads = views.filter((v: any) => v.downloadedAt).length;

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        uniqueViewers,
        avgDuration: Math.round(avgDuration),
        avgCompletionRate: Math.round(avgCompletionRate),
        totalDownloads,
        linkCount: document._count.links,
        viewsByDate: viewsByDateArray.sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        viewersByCountry: viewersByCountryArray.sort(
          (a, b) => (b.count as number) - (a.count as number)
        ),
        recentViews: views.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/analytics/document/[documentId]/track - Track view metrics
export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const body = await request.json();
    const { viewId, duration, completionRate, downloaded } = body;

    if (!viewId) {
      return NextResponse.json(
        { success: false, error: "viewId is required" },
        { status: 400 }
      );
    }

    // Update view record
    const updateData: any = {};

    if (duration !== undefined) {
      updateData.duration = duration;
    }

    if (completionRate !== undefined) {
      updateData.completionRate = completionRate;
    }

    if (downloaded) {
      updateData.downloadedAt = new Date();
    }

    const view = await prisma.view.update({
      where: { id: viewId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: view,
    });
  } catch (error) {
    console.error("Error tracking metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
