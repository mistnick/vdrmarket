"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    FolderOpen,
    FolderTree,
    Database,
    Link2,
    UserCheck,
    Settings,
    LogOut,
    ChevronLeft,
    Building2,
    ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layouts/app-shell";

const navigation = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Documenti", href: "/documents", icon: FileText },
    { title: "Cartelle", href: "/folders", icon: FolderOpen },
    { title: "File Explorer", href: "/file-explorer", icon: FolderTree },
    { title: "Data Rooms", href: "/datarooms", icon: Database },
    { title: "Link", href: "/links", icon: Link2 },
    { title: "Partecipanti", href: "/participants", icon: UserCheck },
    { title: "Report", href: "/audit-logs", icon: ClipboardList },
    { title: "Impostazioni", href: "/settings", icon: Settings },
];

export function SidebarNav() {
    const pathname = usePathname();
    const { isCollapsed, toggle, closeMobile } = useSidebar();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-lg">DataRoom</span>
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
                    {navigation.map((item) => {
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
                <Link
                    href="/api/auth/logout"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Esci" : undefined}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Esci</span>}
                </Link>
            </div>
        </div>
    );
}
