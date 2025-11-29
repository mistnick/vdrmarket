import { Shield, Users, Lock, Activity, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface VDRQuickAccessProps {
    dataRoomId?: string;
}

export function VDRQuickAccess({ dataRoomId }: VDRQuickAccessProps) {
    const vdrPath = dataRoomId ? `/data-rooms/${dataRoomId}/vdr` : "/vdr";

    const quickActions = [
        {
            title: "Gestione Gruppi",
            description: "Crea e gestisci gruppi utente",
            icon: Users,
            href: `${vdrPath}?tab=groups`,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "Invita Utenti",
            description: "Invita nuovi utenti al VDR",
            icon: Shield,
            href: `${vdrPath}?tab=users`,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "Permessi",
            description: "Gestisci permessi documenti",
            icon: Lock,
            href: "/file-explorer",
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            title: "Activity Log",
            description: "Monitora attività VDR",
            icon: Activity,
            href: `${vdrPath}?tab=activity`,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Virtual Data Room</CardTitle>
                </div>
                <CardDescription>
                    Accesso rapido alle funzionalità VDR
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="group relative rounded-lg border p-4 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`rounded-lg p-2 ${action.bgColor}`}>
                                    <action.icon className={`h-5 w-5 ${action.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <Link
                    href={vdrPath}
                    className="mt-4 block w-full text-center text-sm text-primary hover:underline"
                >
                    Vai al VDR completo →
                </Link>
            </CardContent>
        </Card>
    );
}
