import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Shield, Settings, UserMinus, Crown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const { teamId } = await params;

  // Get team with members and permissions
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      members: {
        some: {
          userId: session.userId,
          role: { in: ["OWNER", "ADMIN"] },
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          documents: true,
          folders: true,
          dataRooms: true,
        },
      },
    },
  });

  if (!team) {
    redirect("/dashboard");
  }

  const currentUserRole = team.members.find(m => m.userId === session.userId)?.role;
  const isOwner = currentUserRole === "OWNER";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Team Settings</h1>
          <Badge variant="outline">{team.plan}</Badge>
        </div>
        <p className="text-slate-600">
          Manage team members, roles, and preferences for <span className="font-semibold">{team.name}</span>
        </p>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Basic team details and statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Team Name</p>
              <p className="font-semibold text-slate-900">{team.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Slug</p>
              <p className="font-mono text-sm text-slate-900">{team.slug}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Plan</p>
              <Badge className="mt-1">{team.plan}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">{team._count.documents}</div>
              <div className="text-sm text-slate-600">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{team._count.folders}</div>
              <div className="text-sm text-slate-600">Folders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{team.members.length}</div>
              <div className="text-sm text-slate-600">Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>Manage roles and permissions for team members</CardDescription>
            </div>
            <Link href={`/dashboard/teams/${team.slug}/invite`}>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Invite Member
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {member.user.name || "Unnamed User"}
                      {member.userId === session.userId && (
                        <span className="text-sm text-slate-500 ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-600">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                    {member.role === "OWNER" && <Crown className="w-3 h-3 mr-1" />}
                    {member.role}
                  </Badge>

                  {isOwner && member.userId !== session.userId && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>View and manage pending team invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No pending invitations</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Transfer Ownership</p>
                <p className="text-sm text-slate-600">Transfer team ownership to another member</p>
              </div>
              <Button variant="outline" className="text-orange-600 hover:text-orange-700">
                Transfer
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Delete Team</p>
                <p className="text-sm text-slate-600">
                  Permanently delete this team and all its data
                </p>
              </div>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Delete Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
