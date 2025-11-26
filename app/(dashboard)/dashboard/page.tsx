import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    include: {
      teams: {
        include: {
          team: {
            include: {
              _count: {
                select: {
                  documents: true,
                  folders: true,
                  dataRooms: true,
                  members: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Get total stats across all teams
  const totalDocuments = user?.teams.reduce(
    (sum: number, tm: any) => sum + tm.team._count.documents,
    0
  ) || 0;

  const totalDataRooms = user?.teams.reduce(
    (sum: number, tm: any) => sum + tm.team._count.dataRooms,
    0
  ) || 0;

  const totalMembers = user?.teams.reduce(
    (sum: number, tm: any) => sum + tm.team._count.members,
    0
  ) || 0;

  // Get document views stats
  const documentViews = await prisma.view.count({
    where: {
      document: {
        team: {
          members: {
            some: {
              userId: user?.id,
            },
          },
        },
      },
    },
  });

  // Get active links count
  // A link is active if isActive=true AND (expiresAt is null OR expiresAt > now)
  const activeLinks = await prisma.link.count({
    where: {
      document: {
        team: {
          members: {
            some: {
              userId: user?.id,
            },
          },
        },
      },
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  // Mock storage used (replace with actual calculation later)
  const storageMB = 245.8;

  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      team: {
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  return (
    <DashboardContent
      userName={session?.name || session?.email || "User"}
      totalDocuments={totalDocuments}
      activeLinks={activeLinks}
      documentViews={documentViews}
      totalMembers={totalMembers}
      recentActivity={recentActivity}
    />
  );
}
