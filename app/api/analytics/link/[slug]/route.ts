import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

type RouteParams = {
    params: Promise<{
        slug: string;
    }>;
};

/**
 * GET /api/analytics/link/[slug]
 * Get detailed analytics for a specific link
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { slug } = await params;

        // Get link with document and creator info
        const link = await prisma.link.findUnique({
            where: { slug },
            include: {
                document: {
                    include: {
                        dataRoom: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!link) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this link's data room via GroupMember
        const hasAccess = await prisma.groupMember.findFirst({
            where: {
                group: {
                    dataRoomId: link.document.dataRoomId,
                },
                user: {
                    email: session.email,
                },
            },
        });

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Get views with aggregated statistics
        const views = await prisma.view.findMany({
            where: { linkId: link.id },
            orderBy: { viewedAt: 'desc' },
            include: {
                viewer: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Calculate statistics
        const totalViews = views.length;
        const uniqueViewers = new Set(views.map(v => v.viewerEmail).filter(Boolean)).size;
        const totalDownloads = views.filter(v => v.downloadedAt).length;
        const avgDuration = views.filter(v => v.duration).reduce((acc, v) => acc + (v.duration || 0), 0) / (views.filter(v => v.duration).length || 1);
        const avgCompletionRate = views.filter(v => v.completionRate).reduce((acc, v) => acc + (v.completionRate || 0), 0) / (views.filter(v => v.completionRate).length || 1);

        // Get views by day (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const viewsByDay = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as count
      FROM views
      WHERE link_id = ${link.id}
        AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC
    `;

        // Get top countries/cities
        const viewsByLocation = await prisma.view.groupBy({
            by: ['country', 'city'],
            where: {
                linkId: link.id,
                country: { not: null },
            },
            _count: true,
            orderBy: {
                _count: {
                    country: 'desc',
                },
            },
            take: 10,
        });

        const analytics = {
            link: {
                id: link.id,
                slug: link.slug,
                name: link.name,
                createdAt: link.createdAt,
                expiresAt: link.expiresAt,
                isActive: link.isActive,
            },
            document: {
                id: link.document.id,
                name: link.document.name,
                fileType: link.document.fileType,
            },
            statistics: {
                totalViews,
                uniqueViewers,
                totalDownloads,
                avgDuration: Math.round(avgDuration),
                avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
                downloadRate: totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0,
            },
            viewsByDay: viewsByDay.map(row => ({
                date: row.date,
                count: Number(row.count),
            })),
            viewsByLocation,
            recentViews: views.slice(0, 50).map(view => ({
                id: view.id,
                viewerEmail: view.viewerEmail,
                viewerName: view.viewerName,
                verified: view.verified,
                viewedAt: view.viewedAt,
                duration: view.duration,
                completionRate: view.completionRate,
                downloadedAt: view.downloadedAt,
                country: view.country,
                city: view.city,
            })),
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching link analytics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
