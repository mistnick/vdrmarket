import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { VDRQuickAccess } from "@/components/dashboard/vdr-quick-access";
import { VDRStatsCard } from "@/components/dashboard/vdr-stats-card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    include: {
      groupMemberships: {
        include: {
          group: {
            include: {
              dataRoom: {
                include: {
                  _count: {
                    select: {
                      documents: true,
                      folders: true,
                      groups: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Get unique dataRooms from groupMemberships
  const uniqueDataRooms = new Map();
  user?.groupMemberships.forEach((gm: any) => {
    if (gm.group.dataRoom && !uniqueDataRooms.has(gm.group.dataRoom.id)) {
      uniqueDataRooms.set(gm.group.dataRoom.id, gm.group.dataRoom);
    }
  });
  const dataRoomsArray = Array.from(uniqueDataRooms.values());

  // Get total stats across all dataRooms
  const totalDocuments = dataRoomsArray.reduce(
    (sum: number, dr: any) => sum + dr._count.documents,
    0
  ) || 0;

  const totalDataRooms = dataRoomsArray.length;

  const totalMembers = dataRoomsArray.reduce(
    (sum: number, dr: any) => sum + dr._count.groups,
    0
  ) || 0;

  // Get document views stats
  const dataRoomIds = dataRoomsArray.map((dr: any) => dr.id);
  const documentViews = await prisma.view.count({
    where: {
      document: {
        dataRoomId: {
          in: dataRoomIds,
        },
      },
    },
  });

  // Get active links count
  // A link is active if isActive=true AND (expiresAt is null OR expiresAt > now)
  const activeLinks = await prisma.link.count({
    where: {
      document: {
        dataRoomId: {
          in: dataRoomIds,
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
      dataRoomId: {
        in: dataRoomIds,
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

  // Get VDR stats
  const vdrStats = {
    totalUsers: await prisma.groupMember.count({
      where: {
        group: {
          dataRoomId: {
            in: dataRoomIds,
          },
        },
      },
    }),
    activeGroups: await prisma.group.count({
      where: {
        dataRoomId: {
          in: dataRoomIds,
        },
      },
    }),
    pendingInvitations: 0, // Could track pending invites
    recentActivity: await prisma.auditLog.count({
      where: {
        dataRoomId: {
          in: dataRoomIds,
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
    documentsShared: totalDocuments,
  };

  // Get first data room ID for VDR quick access
  const firstDataRoomId = dataRoomsArray[0]?.id;

  return (
    <div className="space-y-6">
      <DashboardContent
        userName={session?.name || session?.email || "User"}
        totalDocuments={totalDocuments}
        activeLinks={activeLinks}
        documentViews={documentViews}
        totalMembers={totalMembers}
        recentActivity={recentActivity}
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <VDRStatsCard stats={vdrStats} />
        <VDRQuickAccess dataRoomId={firstDataRoomId} />
      </div>
    </div>
  );
}
