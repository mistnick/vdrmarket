"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderTree,
    Database,
    Link2,
    UserCheck,
    Settings,
    LogOut,
    ChevronLeft,
    Building2,
    ClipboardList,
    Shield,
    MessageSquare,
    BarChart3,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layouts/app-shell";
import { useCurrentPermissions, type UserPermissions } from "@/hooks/use-permissions";
import { useMemo } from "react";

interface NavigationItem {
    title: string;
    href: string;
    icon: LucideIcon;
    /** Funzione che verifica se l'utente ha i permessi per vedere questa voce */
    requiresPermission?: (permissions: UserPermissions) => boolean;
}

const navigation: NavigationItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "File Explorer", href: "/file-explorer", icon: FolderTree },
    {
        title: "Gestione",
        href: "/vdr",
        icon: Shield,
        requiresPermission: (p) => p.isAdministrator || p.canManageGroups || p.canManageUsers,
    },
    { title: "Data Rooms", href: "/datarooms", icon: Database },
    {
        title: "Link",
        href: "/links",
        icon: Link2,
        requiresPermission: (p) => p.canViewLinks,
    },
    {
        title: "Partecipanti",
        href: "/participants",
        icon: UserCheck,
        requiresPermission: (p) => p.isAdministrator || p.canManageUsers || p.canViewGroupUsers,
    },
    {
        title: "Q&A",
        href: "/qa",
        icon: MessageSquare,
        requiresPermission: (p) => p.canManageQA || p.isAdministrator,
    },
    {
        title: "Insights",
        href: "/insights",
        icon: BarChart3,
        requiresPermission: (p) => p.isAdministrator || p.canViewGroupActivity,
    },
    {
        title: "Report",
        href: "/audit-logs",
        icon: ClipboardList,
        requiresPermission: (p) => p.canViewAudit,
    },
    {
        title: "Impostazioni",
        href: "/settings",
        icon: Settings,
        requiresPermission: (p) => p.canViewSettings,
    },
];

export function SidebarNav() {
    const pathname = usePathname();
    const { isCollapsed, toggle, closeMobile } = useSidebar();
    const { permissions, isLoading } = useCurrentPermissions();

    // Filtra le voci di navigazione in base ai permessi
    const filteredNavigation = useMemo(() => {
        // Durante il caricamento o se non ci sono permessi (no dataroom),
        // mostra solo le voci base
        if (isLoading || !permissions.groupType) {
            return navigation.filter(
                (item) => !item.requiresPermission || 
                    ["Dashboard", "File Explorer", "Data Rooms"].includes(item.title)
            );
        }

        return navigation.filter((item) => {
            // Se non richiede permessi specifici, mostra sempre
            if (!item.requiresPermission) {
                return true;
            }
            // Altrimenti verifica i permessi
            return item.requiresPermission(permissions);
        });
    }, [permissions, isLoading]);

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-lg">SimpleVDR</span>
                    )}
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex h-8 w-8"
                    onClick={toggle}
                >
                    <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={closeMobile}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                    title={isCollapsed ? item.title : undefined}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>{item.title}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="border-t p-3">
                <button
                    onClick={() => window.location.href = "/auth/logout"}
                    className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Esci" : undefined}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Esci</span>}
                </button>
            </div>
        </div>
    );
}
