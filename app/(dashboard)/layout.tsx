import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { AppShell } from "@/components/layouts/app-shell";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { DashboardClientWrapper } from "@/components/layouts/dashboard-client-wrapper";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || !session.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: {
      name: true,
      email: true,
      image: true,
      isSuperAdmin: true,
    },
  });

  // Super admin cannot access /dashboard - redirect to /admin
  if (user?.isSuperAdmin) {
    redirect("/admin");
  }

  return (
    <DashboardClientWrapper>
      <AppShell
        sidebar={<SidebarNav />}
        header={<DashboardHeader user={user || undefined} />}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </AppShell>
    </DashboardClientWrapper>
  );
}
