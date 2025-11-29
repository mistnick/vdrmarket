import { Shield, Users, FileText, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VDRStatsCardProps {
    stats?: {
        totalUsers?: number;
        activeGroups?: number;
        pendingInvitations?: number;
        recentActivity?: number;
        documentsShared?: number;
    };
}

export function VDRStatsCard({ stats }: VDRStatsCardProps) {
    const defaultStats = {
        totalUsers: stats?.totalUsers ?? 0,
        activeGroups: stats?.activeGroups ?? 0,
        pendingInvitations: stats?.pendingInvitations ?? 0,
        recentActivity: stats?.recentActivity ?? 0,
        documentsShared: stats?.documentsShared ?? 0,
    };

    const statItems = [
        {
            label: "Utenti Attivi",
            value: defaultStats.totalUsers,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Gruppi",
            value: defaultStats.activeGroups,
            icon: Shield,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            label: "Documenti",
            value: defaultStats.documentsShared,
            icon: FileText,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            label: "Attività (7g)",
            value: defaultStats.recentActivity,
            icon: Activity,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Statistiche VDR</CardTitle>
                        <CardDescription>Panoramica sistema Virtual Data Room</CardDescription>
                    </div>
                    {defaultStats.pendingInvitations > 0 && (
                        <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {defaultStats.pendingInvitations} inviti in sospeso
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statItems.map((item) => (
                        <div key={item.label} className={`rounded-lg p-4 ${item.bgColor}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {item.label}
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                    ))}
                </div>

                {defaultStats.totalUsers === 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                            Nessun dato disponibile. Inizia invitando utenti al VDR.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
