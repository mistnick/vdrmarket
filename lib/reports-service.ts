import { prisma } from "@/lib/db/prisma";

export interface ReportSummary {
    totalAccesses: number;
    uniqueViewers: number;
    topDocuments: { name: string; views: number }[];
    recentActivity: {
        action: string;
        user: string;
        resource: string;
        date: Date;
    }[];
}

export async function generateVerificationReport(teamId: string): Promise<ReportSummary> {
    // Mocking teamId filter if not strictly enforced in audit logs yet
    // In a real scenario, we would filter by teamId

    const auditLogs = await prisma.auditLog.findMany({
        where: { teamId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: true },
    });

    const views = await prisma.view.findMany({
        where: {
            document: {
                teamId: teamId
            }
        },
        include: { document: true },
    });

    // Calculate metrics
    const totalAccesses = views.length;
    const uniqueViewers = new Set(views.map(v => v.viewerEmail || v.ipAddress)).size;

    // Top documents
    const docViews: Record<string, number> = {};
    views.forEach(v => {
        const name = v.document.name;
        docViews[name] = (docViews[name] || 0) + 1;
    });

    const topDocuments = Object.entries(docViews)
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    const recentActivity = auditLogs.map(log => ({
        action: log.action,
        user: log.user?.email || "Unknown",
        resource: `${log.resourceType}: ${log.resourceId}`,
        date: log.createdAt,
    }));

    return {
        totalAccesses,
        uniqueViewers,
        topDocuments,
        recentActivity,
    };
}
