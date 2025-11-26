"use client";

import { ReactNode, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface SidebarContextType {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    toggle: () => void;
    toggleMobile: () => void;
    closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    isMobileOpen: false,
    toggle: () => { },
    toggleMobile: () => { },
    closeMobile: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

interface AppShellProps {
    sidebar: ReactNode;
    header: ReactNode;
    children: ReactNode;
}

/**
 * AppShell - Layout principale dell'applicazione
 * 
 * Struttura semplificata:
 * - Sidebar a sinistra (256px desktop, overlay mobile)
 * - Header fisso in alto
 * - Content area scrollabile
 */
export function AppShell({ sidebar, header, children }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggle = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
    const closeMobile = () => setIsMobileOpen(false);

    return (
        <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, toggle, toggleMobile, closeMobile }}>
            <div className="min-h-screen bg-background">
                {/* Mobile overlay */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={closeMobile}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 z-50 h-full bg-card border-r transition-all duration-200",
                        // Desktop
                        "hidden lg:block",
                        isCollapsed ? "lg:w-16" : "lg:w-64",
                    )}
                >
                    {sidebar}
                </aside>

                {/* Mobile Sidebar */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transition-transform duration-200 lg:hidden",
                        isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    {sidebar}
                </aside>

                {/* Main area */}
                <div
                    className={cn(
                        "min-h-screen transition-all duration-200",
                        isCollapsed ? "lg:pl-16" : "lg:pl-64"
                    )}
                >
                    {/* Header */}
                    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {header}
                    </header>

                    {/* Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
