"use client";

import { useState, useEffect } from "react";
import { Users, Shield, MoreVertical, UserCog, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { ManagePermissionsDialog } from "@/components/users/manage-permissions-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        createdAt: string;
    };
}

export default function UsersSettingsPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [teamId, setTeamId] = useState<string>("");
    const [permissionsDialog, setPermissionsDialog] = useState<{
        open: boolean;
        userId: string;
        userName: string;
    }>({
        open: false,
        userId: "",
        userName: "",
    });

    useEffect(() => {
        async function fetchTeam() {
            try {
                const response = await fetch("/api/teams/current");
                if (response.ok) {
                    const result = await response.json();
                    setTeamId(result.id || "");
                }
            } catch (error) {
                console.error("Error fetching team:", error);
            }
        }
        fetchTeam();
    }, []);

    useEffect(() => {
        if (teamId) {
            fetchMembers();
        }
    }, [teamId]);

    const fetchMembers = async () => {
        if (!teamId) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/teams/${teamId}/members`);
            if (response.ok) {
                const data = await response.json();
                setMembers(data.data);
            } else {
                toast.error("Failed to fetch team members");
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to fetch team members");
        } finally {
            setLoading(false);
        }
    };

    const updateMemberRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/teams/${teamId}/members`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    role: newRole,
                }),
            });

            if (response.ok) {
                toast.success("Role updated successfully");
                fetchMembers(); // Refresh the list
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update role");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent";
            case "admin":
                return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent";
            case "member":
                return "bg-green-100 text-green-700 hover:bg-green-200 border-transparent";
            case "viewer":
                return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    const breadcrumbs = [
        { label: "Home", href: "/dashboard" },
        { label: "Settings", href: "/settings" },
        { label: "Users & Permissions" },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users & Permissions"
                description="Manage team members and their access levels"
                breadcrumbs={breadcrumbs}
            />

            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members ({members.length})
                        </CardTitle>
                        <Button variant="outline" size="sm">
                            <UserCog className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading...</div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {getInitials(member.user.name, member.user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">
                                                    {member.user.name || "Unknown User"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {member.user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) =>
                                                    updateMemberRole(member.userId, value)
                                                }
                                            >
                                                <SelectTrigger className="w-[120px] h-7 border-none shadow-none">
                                                    <Badge
                                                        variant="secondary"
                                                        className={getRoleBadgeColor(member.role)}
                                                    >
                                                        <SelectValue />
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="owner">Owner</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDistanceToNow(new Date(member.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setPermissionsDialog({
                                                                    open: true,
                                                                    userId: member.userId,
                                                                    userName: member.user.name || member.user.email,
                                                                })
                                                            }
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Manage Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove from Team
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Manage Permissions Dialog */}
            <ManagePermissionsDialog
                open={permissionsDialog.open}
                onOpenChange={(open) =>
                    setPermissionsDialog((prev) => ({ ...prev, open }))
                }
                userId={permissionsDialog.userId}
                userName={permissionsDialog.userName}
                teamId={teamId}
            />
        </div>
    );
}
