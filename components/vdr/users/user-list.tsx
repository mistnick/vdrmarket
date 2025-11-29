"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Mail, UserCheck, UserX, Settings } from "lucide-react";
import { format } from "date-fns";

interface User {
    id: string;
    name: string | null;
    email: string;
    status: string;
    accessType: string;
    accessStartAt: Date | null;
    accessEndAt: Date | null;
    twoFactorEnabled: boolean;
    isActive: boolean;
    groupMemberships: Array<{
        group: {
            id: string;
            name: string;
            type: string;
        };
    }>;
}

interface UserListProps {
    users: User[];
    onEditUser: (user: User) => void;
    onDeactivateUser: (userId: string) => void;
    onResendInvite: (email: string) => void;
    canManage: boolean;
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    PENDING_INVITE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    DEACTIVATED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function UserList({
    users,
    onEditUser,
    onDeactivateUser,
    onResendInvite,
    canManage,
}: UserListProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Access</TableHead>
                            <TableHead>Groups</TableHead>
                            <TableHead>2FA</TableHead>
                            {canManage && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{user.name || "Unknown"}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusColors[user.status]} variant="secondary">
                                        {user.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p className="font-medium">{user.accessType}</p>
                                        {user.accessType === "LIMITED" && (
                                            <p className="text-xs text-muted-foreground">
                                                {user.accessStartAt &&
                                                    format(new Date(user.accessStartAt), "MMM d, yyyy")}
                                                {" - "}
                                                {user.accessEndAt
                                                    ? format(new Date(user.accessEndAt), "MMM d, yyyy")
                                                    : "No end"}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.groupMemberships.slice(0, 2).map((gm) => (
                                            <Badge key={gm.group.id} variant="outline" className="text-xs">
                                                {gm.group.name}
                                            </Badge>
                                        ))}
                                        {user.groupMemberships.length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{user.groupMemberships.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.twoFactorEnabled ? (
                                        <UserCheck className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <UserX className="h-4 w-4 text-gray-400" />
                                    )}
                                </TableCell>
                                {canManage && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEditUser(user)}>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Edit Settings
                                                </DropdownMenuItem>
                                                {user.status === "PENDING_INVITE" && (
                                                    <DropdownMenuItem onClick={() => onResendInvite(user.email)}>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Resend Invite
                                                    </DropdownMenuItem>
                                                )}
                                                {user.status === "ACTIVE" && (
                                                    <DropdownMenuItem
                                                        onClick={() => onDeactivateUser(user.id)}
                                                        className="text-red-600"
                                                    >
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm text-muted-foreground">
                            Invite users to get started
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
