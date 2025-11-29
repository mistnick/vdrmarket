"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutClientProps {
  children: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="fixed top-0 left-0 z-50 h-full hidden lg:block">
        <AdminSidebar user={user} />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebar user={user} onClose={() => setIsMobileOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Mobile header - solo per aprire menu */}
        <header className="sticky top-0 z-30 lg:hidden bg-slate-900 border-b border-slate-800">
          <div className="flex h-14 items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Apri menu</span>
            </Button>
          </div>
        </header>

        {/* Content - no padding, full dark bg */}
        <main className="flex-1 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
