"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Shield, Palette, Bell, CreditCard, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

const settingsNavigation = [
  {
    name: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    name: "Users & Permissions",
    href: "/settings/users",
    icon: Users, // Changed icon to Users for Users & Permissions
    description: "Manage team members and access control",
  },
  {
    name: "Team",
    href: "/settings/team",
    icon: Users,
    description: "Team settings and preferences",
  },
  {
    name: "Privacy & Security",
    href: "/settings/privacy",
    icon: Shield,
    description: "GDPR, data export, and account deletion",
  },
  {
    name: "Branding",
    href: "/settings/branding",
    icon: Palette,
    description: "Customize your workspace appearance",
  },
  {
    name: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Configure email and in-app notifications",
  },
  {
    name: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Manage subscription and payment methods",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <nav className="lg:col-span-1 space-y-1">
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 opacity-80">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
