"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Eye,
    Users,
    Clock,
    Download,
    TrendingUp,
    Globe,
    Calendar
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface AnalyticsData {
    totalViews: number;
    uniqueViewers: number;
    avgDuration: number;
    avgCompletionRate: number;
    totalDownloads: number;
    linkCount: number;
    viewsByDate: { date: string; count: number }[];
    viewersByCountry: { country: string; count: number }[];
    recentViews: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DocumentAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [unwrappedParams.id]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`/api/analytics/document/${unwrappedParams.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch analytics");
            }

            setAnalytics(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-500">
                            <p>Error loading analytics: {error}</p>
                            <Button onClick={() => router.back()} className="mt-4">
                                Go Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Document Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive insights and metrics for your document
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalViews}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.linkCount} active {analytics.linkCount === 1 ? "link" : "links"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.uniqueViewers}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.totalViews > 0
                                ? `${((analytics.uniqueViewers / analytics.totalViews) * 100).toFixed(1)}% unique`
                                : "No views yet"}
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
                            {formatDuration(analytics.avgDuration)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.avgCompletionRate}% completion rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.totalViews > 0
                                ? `${((analytics.totalDownloads / analytics.totalViews) * 100).toFixed(1)}% of views`
                                : "No downloads"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Views Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Views Over Time
                        </CardTitle>
                        <CardDescription>Document views in the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.viewsByDate.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.viewsByDate}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => format(new Date(date), "MMM dd")}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(date) => format(new Date(date as string), "MMM dd, yyyy")}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        name="Views"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No view data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Viewers by Country */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Viewers by Location
                        </CardTitle>
                        <CardDescription>Geographic distribution of viewers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.viewersByCountry.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.viewersByCountry.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="country" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#8884d8" name="Viewers" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No location data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Views Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Recent Views
                    </CardTitle>
                    <CardDescription>Latest document access activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.recentViews.length > 0 ? (
                        <div className="space-y-4">
                            {analytics.recentViews.map((view: any, index: number) => (
                                <div
                                    key={view.id || index}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {view.viewerEmail || view.viewerName || "Anonymous"}
                                            </span>
                                            {view.verified && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {view.country || "Unknown location"} •
                                            {view.duration ? ` ${formatDuration(view.duration)}` : " No duration"} •
                                            {view.downloadedAt && " Downloaded"}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(new Date(view.viewedAt), "MMM dd, yyyy HH:mm")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No views recorded yet
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
