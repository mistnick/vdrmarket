"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    FileText, 
    Link2, 
    Eye, 
    Users, 
    Upload, 
    FolderPlus, 
    Plus,
    Activity,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface DashboardContentProps {
    userName: string;
    totalDocuments: number;
    activeLinks: number;
    documentViews: number;
    totalMembers: number;
    recentActivity: any[];
}

export function DashboardContent({
    userName,
    totalDocuments,
    activeLinks,
    documentViews,
    totalMembers,
    recentActivity,
}: DashboardContentProps) {
    const firstName = userName.split(" ")[0];
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Ciao, {firstName}
                    </h1>
                    <p className="text-muted-foreground">
                        Ecco cosa sta succedendo nella tua data room
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/datarooms/create">
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Nuova Data Room
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/file-explorer">
                            <Upload className="mr-2 h-4 w-4" />
                            Carica
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalDocuments}</p>
                                <p className="text-sm text-muted-foreground">Documenti</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                                <Link2 className="h-6 w-6 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeLinks}</p>
                                <p className="text-sm text-muted-foreground">Link attivi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                                <Eye className="h-6 w-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{documentViews}</p>
                                <p className="text-sm text-muted-foreground">Visualizzazioni</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                                <Users className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalMembers}</p>
                                <p className="text-sm text-muted-foreground">Membri team</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions + Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Azioni rapide</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Link 
                            href="/file-explorer"
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                        >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Carica documento</p>
                                <p className="text-xs text-muted-foreground">PDF, Word, Excel, immagini</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link 
                            href="/datarooms/create"
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                        >
                            <FolderPlus className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Crea data room</p>
                                <p className="text-xs text-muted-foreground">Spazio sicuro per condividere</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link 
                            href="/links/create"
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                        >
                            <Link2 className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Genera link</p>
                                <p className="text-xs text-muted-foreground">Condividi in sicurezza</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Attività recente</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/audit-logs">Vedi tutto</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Nessuna attività recente
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.slice(0, 5).map((activity) => (
                                    <div 
                                        key={activity.id} 
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {activity.user?.name?.charAt(0) || "U"}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="leading-none">
                                                <span className="font-medium">
                                                    {activity.user?.name || "Utente"}
                                                </span>
                                                {" "}
                                                <span className="text-muted-foreground">
                                                    {activity.action.toLowerCase().replace(/_/g, " ")}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {mounted
                                                    ? format(new Date(activity.createdAt), "d MMM, HH:mm", { locale: it })
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
