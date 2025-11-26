"use client";

import { Bell, HelpCircle, Settings } from "lucide-react";
import { GlobalSearch } from "@/components/shared/global-search";
import { useI18n } from "@/lib/i18n-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AppHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user?.email?.[0].toUpperCase() || "U";

  const { t, language, setLanguage } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <span className="text-sm font-bold text-white">DR</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">DataRoom</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <span className="font-bold">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("it")}>
                Italiano
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-gray-600">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-600 relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-white">
              3
            </Badge>
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-gray-200">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings/profile" className="w-full">
                  {t("common.profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings/team" className="w-full">
                  Team Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/api/auth/logout" className="w-full text-red-600">
                  {t("common.signOut")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
