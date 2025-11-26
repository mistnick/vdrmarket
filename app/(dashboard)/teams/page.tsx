import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, UserPlus, MoreVertical, FileText, FolderOpen, Shield } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default async function TeamsPage() {
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
              members: {
                include: {
                  user: true,
                },
              },
              _count: {
                select: {
                  documents: true,
                  dataRooms: true,
                  folders: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const userTeams = user?.teams || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Teams"
        description="Manage your teams and collaborate with others"
        actions={
          <Link href="/teams/create">
            <Button>
              <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Create Team
            </Button>
          </Link>
        }
      />

      {/* Teams Grid */}
      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Create or join a team to start collaborating"
              action={{
                label: "Create Team",
                href: "/teams/create",
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userTeams.map((tm) => (
            <Card
              key={tm.team.id}
              className="hover:border-primary/50 transition-colors group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {tm.team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tm.team.name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {tm.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/teams/${tm.team.id}`}>
                          <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          View Team
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/teams/${tm.team.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/teams/${tm.team.id}/invite`}>
                          <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Invite Members
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{tm.team.members.length}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <FileText className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                      <div className="font-semibold">{tm.team._count.documents}</div>
                      <div className="text-muted-foreground">Docs</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <FolderOpen className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                      <div className="font-semibold">{tm.team._count.folders}</div>
                      <div className="text-muted-foreground">Folders</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Shield className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                      <div className="font-semibold">{tm.team._count.dataRooms}</div>
                      <div className="text-muted-foreground">Rooms</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
