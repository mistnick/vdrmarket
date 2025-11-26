import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user to check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv"; // csv or json
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");

    // Build where clause
    const where: any = {
      teamId: {
        in: user.teams.map((tm) => tm.teamId),
      },
    };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    // Fetch all matching logs (limit to 10000 for safety)
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10000,
    });

    if (format === "json") {
      // JSON export
      return NextResponse.json(logs, {
        headers: {
          "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.json"`,
          "Content-Type": "application/json",
        },
      });
    } else {
      // CSV export
      const csvHeader =
        "Timestamp,User,Email,Team,Action,Resource Type,Resource ID,IP Address,Metadata\n";

      const csvRows = logs.map((log) => {
        const timestamp = new Date(log.createdAt).toISOString();
        const userName = log.user?.name || "Unknown";
        const userEmail = log.user?.email || "Unknown";
        const teamName = log.team?.name || "Unknown";
        const metadata = log.metadata
          ? JSON.stringify(log.metadata).replace(/"/g, '""')
          : "";

        return `"${timestamp}","${userName}","${userEmail}","${teamName}","${log.action}","${log.resourceType}","${log.resourceId}","${log.ipAddress || ""}","${metadata}"`;
      }).join("\n");

      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.csv"`,
          "Content-Type": "text/csv",
        },
      });
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
