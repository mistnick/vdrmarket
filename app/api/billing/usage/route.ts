import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

/**
 * GET /api/billing/usage
 * Get current usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.userId,
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamId = teamMember.teamId;

    // Get document count
    const documentCount = await prisma.document.count({
      where: {
        teamId,
      },
    });

    // Get total storage used (sum of file sizes)
    const storageResult = await prisma.document.aggregate({
      where: {
        teamId,
      },
      _sum: {
        fileSize: true,
      },
    });

    const storageUsed = storageResult._sum?.fileSize || 0;

    // Get view count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewCount = await prisma.view.count({
      where: {
        viewedAt: {
          gte: thirtyDaysAgo,
        },
        link: {
          document: {
            teamId,
          },
        },
      },
    });

    // Define plan limits (should come from database/config in production)
    const planLimits = {
      documents: 100,
      storage: 10 * 1024 * 1024 * 1024, // 10GB in bytes
      views: 10000,
    };

    return NextResponse.json({
      usage: {
        documents: documentCount,
        storage: storageUsed,
        views: viewCount,
      },
      limits: planLimits,
      percentages: {
        documents: (documentCount / planLimits.documents) * 100,
        storage: (storageUsed / planLimits.storage) * 100,
        views: (viewCount / planLimits.views) * 100,
      },
    });
  } catch (error) {
    console.error("Error fetching billing usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
