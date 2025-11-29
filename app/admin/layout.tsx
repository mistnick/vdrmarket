import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: { 
      isSuperAdmin: true,
      name: true,
      email: true,
    },
  });

  if (!user?.isSuperAdmin) {
    redirect("/dashboard");
  }

  return (
    <AdminLayoutClient user={{ name: user.name, email: user.email }}>
      {children}
    </AdminLayoutClient>
  );
}
