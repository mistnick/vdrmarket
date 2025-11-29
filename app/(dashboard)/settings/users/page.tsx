"use client";

import { useState, useEffect } from "react";
import { Users, Shield, MoreVertical, UserCog, Trash2, Mail, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { InviteMemberDialog } from "@/components/users/invite-member-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

interface GroupMember {
    id: string;
    groupId: string;
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
    group: {
        id: string;
        name: string;
        type: string;
        dataRoomId: string;
    };
}

interface DataRoom {
    id: string;
    name: string;
}

export default function UsersSettingsPage() {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [dataRooms, setDataRooms] = useState<DataRoom[]>([]);
    const [selectedDataRoom, setSelectedDataRoom] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [permissionsDialog, setPermissionsDialog] = useState<{
        open: boolean;
        userId: string;
        userName: string;
    }>({
        open: false,
        userId: "",
        userName: "",
    });
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    useEffect(() => {
        async function fetchDataRooms() {
            try {
                const response = await fetch("/api/datarooms", {
                    credentials: "include"
                });
                if (response.ok) {
                    const result = await response.json();
                    setDataRooms(result.data || []);
                    if (result.data?.length > 0) {
                        setSelectedDataRoom(result.data[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching data rooms:", error);
            }
        }
        fetchDataRooms();
    }, []);

    useEffect(() => {
        if (selectedDataRoom) {
            fetchMembers();
        }
    }, [selectedDataRoom]);

    const fetchMembers = async () => {
        if (!selectedDataRoom) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members`, {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data.data || []);
            } else {
                toast.error("Failed to fetch members");
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to fetch members");
        } finally {
            setLoading(false);
        }
    };

    const updateMemberRole = async (memberId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members/\${memberId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    role: newRole,
                }),
            });

            if (response.ok) {
                toast.success("Role updated successfully");
                fetchMembers();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update role");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const deleteMembers = async (rows: GroupMember[]) => {
        let successCount = 0;
        for (const member of rows) {
            if (member.role === 'owner') {
                toast.error(`Cannot remove owner: \${member.user.email}`);
                continue;
            }

            try {
                const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members/\${member.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    successCount++;
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (successCount > 0) {
            toast.success(`Removed \${successCount} member(s)`);
            fetchMembers();
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

    const memberColumns: ColumnDef<GroupMember>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "user.email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        User
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(member.user.name, member.user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">
                                {member.user.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {member.user.email}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "group.name",
            header: "Group",
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <Badge variant="outline">{member.group.name}</Badge>
                );
            },
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <Select
                        value={member.role}
                        onValueChange={(value) =>
                            updateMemberRole(member.id, value)
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
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Joined",
            cell: ({ row }) => {
                return (
                    <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(row.original.createdAt), {
                            addSuffix: true,
                        })}
                    </span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className="text-right">
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
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMembers([member])}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Member
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const breadcrumbs = [
        { label: "Home", href: "/dashboard" },
        { label: "Settings", href: "/settings" },
        { label: "Users & Permissions" },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users & Permissions"
                description="Manage data room members and their access levels"
                breadcrumbs={breadcrumbs}
            />

            {/* Data Room Selector */}
            <Card className="border-border/60 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Select Data Room:</span>
                        <Select value={selectedDataRoom} onValueChange={setSelectedDataRoom}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select a data room" />
                            </SelectTrigger>
                            <SelectContent>
                                {dataRooms.map((dr) => (
                                    <SelectItem key={dr.id} value={dr.id}>
                                        {dr.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Members ({members.length})
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInviteDialogOpen(true)}
                            disabled={!selectedDataRoom}
                        >
                            <UserCog className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading...</div>
                        </div>
                    ) : (
                        <DataTable
                            columns={memberColumns}
                            data={members}
                            searchKey="user.email"
                            onDelete={deleteMembers}
                            deleteLabel="Remove"
                        />
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
                dataRoomId={selectedDataRoom}
            />

            {/* Invite Member Dialog */}
            <InviteMemberDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                dataRoomId={selectedDataRoom}
                onInviteSuccess={() => {
                    fetchMembers();
                }}
            />
        </div>
    );
}
