import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, FileText, Folder, Shield, UserPlus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type RouteParams = {
    params: Promise<{
        teamId: string;
    }>;
};

export default async function TeamDashboardPage({ params }: RouteParams) {
    const session = await getSession();

    if (!session) {
        redirect("/auth/login");
    }

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            members: {
                include: {
                    user: true,
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
        notFound();
    }

    // Check if user is a member
    const member = team.members.find(m => m.user.email === session.email);
    if (!member) {
        redirect("/teams");
    }

    const isAdmin = member.role === "OWNER" || member.role === "ADMIN" || member.role === "owner" || member.role === "admin";

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>dataroom.com/teams/{team.slug}</span>
                            <Badge variant="outline" className="capitalize">{member.role}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isAdmin && (
                        <>
                            <Link href={`/teams/${teamId}/settings`}>
                                <Button variant="outline">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Button>
                            </Link>
                            <Link href={`/teams/${teamId}/invite`}>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Member
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team._count.documents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Data Rooms</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team._count.dataRooms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.members.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Members Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who has access to this team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {team.members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>
                                            {m.user.name?.charAt(0) || m.user.email.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{m.user.name || 'Unnamed User'}</p>
                                        <p className="text-sm text-muted-foreground">{m.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                                        {m.role}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Joined {new Date(m.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
