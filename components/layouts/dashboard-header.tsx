"use client";

import { Menu, Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSidebar } from "@/components/layouts/app-shell";
import { TenantSwitcher } from "@/components/shared/tenant-switcher";
import { StorageGauge } from "@/components/shared/storage-gauge";

interface DashboardHeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
    };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const { toggleMobile } = useSidebar();

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user?.email?.[0].toUpperCase() || "U";

    return (
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
            {/* Left: Mobile menu button + Tenant Switcher */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={toggleMobile}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Apri menu</span>
                </Button>
                
                {/* Tenant Switcher */}
                <TenantSwitcher />
                
                {/* Storage Gauge */}
                <StorageGauge size={36} />
            </div>

            {/* Center spacer */}
            <div className="flex-1" />

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                    <Link href="/notifications">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifiche</span>
                    </Link>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">
                                    {user?.name || "Utente"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings/profile" className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                Profilo
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                Impostazioni
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/auth/logout" className="flex items-center text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Esci
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
