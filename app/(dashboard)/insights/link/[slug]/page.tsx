import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Share2, Download, TrendingUp, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return {
        title: 'Link Analytics | DataRoom',
    };
}

export default async function LinkAnalyticsPage({ params }: PageProps) {
    const session = await getSession();

    if (!session?.email) {
        redirect('/auth/login');
    }

    const { slug } = await params;

    // Fetch analytics data from API (server-side)
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
            views: {
                orderBy: {
                    viewedAt: 'desc',
                },
            },
        },
    });

    if (!link) {
        notFound();
    }

    // Check access via GroupMember
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
        redirect('/dashboard');
    }

    // Calculate statistics
    const totalViews = link.views.length;
    const uniqueViewers = new Set(link.views.map(v => v.viewerEmail).filter(Boolean)).size;
    const totalDownloads = link.views.filter(v => v.downloadedAt).length;
    const avgDuration = link.views
        .filter(v => v.duration)
        .reduce((acc, v) => acc + (v.duration || 0), 0) / (link.views.filter(v => v.duration).length || 1);
    const avgCompletionRate = link.views
        .filter(v => v.completionRate)
        .reduce((acc, v) => acc + (v.completionRate || 0), 0) / (link.views.filter(v => v.completionRate).length || 1);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
                <Link href="/links" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Links
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">Link Analytics</h1>
                        <p className="text-muted-foreground">
                            {link.name || link.slug}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Document: {link.document.name}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/links/${link.slug}`}>View Link</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueViewers}</div>
                        <p className="text-xs text-muted-foreground">
                            Identified viewers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDownloads}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalViews > 0 ? `${Math.round((totalDownloads / totalViews) * 100)}% conversion` : '0%'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(avgDuration)}s
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round(avgCompletionRate)}% completion
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Views */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Recent Views</CardTitle>
                    <CardDescription>Latest activity on this link</CardDescription>
                </CardHeader>
                <CardContent>
                    {link.views.length > 0 ? (
                        <div className="space-y-4">
                            {link.views.slice(0, 20).map((view) => (
                                <div key={view.id} className="flex items-start justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">
                                                {view.viewerName || view.viewerEmail || 'Anonymous'}
                                            </p>
                                            {view.verified && (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>{formatDistanceToNow(view.viewedAt, { addSuffix: true })}</p>
                                            {view.city && view.country && (
                                                <p>{view.city}, {view.country}</p>
                                            )}
                                            {view.duration && (
                                                <p>Duration: {view.duration}s</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-sm">
                                        {view.downloadedAt && (
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Download className="h-3 w-3" />
                                                Downloaded
                                            </span>
                                        )}
                                        {view.completionRate !== null && (
                                            <span className="text-muted-foreground">
                                                {Math.round(view.completionRate)}% viewed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Eye className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <p className="text-muted-foreground">No views yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Share this link to start tracking views
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Link Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Link Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium mb-1">Created</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(link.createdAt, { addSuffix: true })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Created By</p>
                            <p className="text-sm text-muted-foreground">
                                {link.creator.name || link.creator.email}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Status</p>
                            <p className="text-sm text-muted-foreground">
                                {link.isActive ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                        {link.expiresAt && (
                            <div>
                                <p className="text-sm font-medium mb-1">Expires</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(link.expiresAt, { addSuffix: true })}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium mb-1">Download Allowed</p>
                            <p className="text-sm text-muted-foreground">
                                {link.allowDownload ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Email Protected</p>
                            <p className="text-sm text-muted-foreground">
                                {link.emailProtected ? 'Yes' : 'No'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
