"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings, Trash2 } from "lucide-react";
import { Group, GroupType } from "@prisma/client";

interface GroupWithMembers extends Group {
    _count: {
        members: number;
    };
}

interface GroupListProps {
    dataRoomId: string;
    groups: GroupWithMembers[];
    onCreateGroup: () => void;
    onEditGroup: (group: GroupWithMembers) => void;
    onDeleteGroup: (groupId: string) => void;
    canManage: boolean;
    currentUserGroupIds: string[];
}

const groupTypeColors: Record<GroupType, string> = {
    ADMINISTRATOR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    USER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    CUSTOM: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export function GroupList({
    groups,
    onCreateGroup,
    onEditGroup,
    onDeleteGroup,
    canManage,
    currentUserGroupIds,
}: GroupListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
                    <p className="text-muted-foreground">
                        Manage access groups and their permissions
                    </p>
                </div>
                {canManage && (
                    <Button onClick={onCreateGroup}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Group
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                    const isUserInGroup = currentUserGroupIds.includes(group.id);

                    return (
                        <Card key={group.id} className="relative">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                        <Badge className={groupTypeColors[group.type]} variant="secondary">
                                            {group.type}
                                        </Badge>
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditGroup(group)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            {group.type !== "ADMINISTRATOR" && !isUserInGroup && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDeleteGroup(group.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {group.description && (
                                    <CardDescription>{group.description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{group._count.members} members</span>
                                </div>

                                {group.type !== "ADMINISTRATOR" && (
                                    <div className="mt-4 space-y-2 text-xs">
                                        <p className="font-semibold">Permissions:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {group.canViewDueDiligenceChecklist && (
                                                <Badge variant="outline" className="text-xs">
                                                    Due Diligence
                                                </Badge>
                                            )}
                                            {group.canManageDocumentPermissions && (
                                                <Badge variant="outline" className="text-xs">
                                                    Manage Permissions
                                                </Badge>
                                            )}
                                            {group.canViewGroupUsers && (
                                                <Badge variant="outline" className="text-xs">
                                                    View Users
                                                </Badge>
                                            )}
                                            {group.canManageUsers && (
                                                <Badge variant="outline" className="text-xs">
                                                    Manage Users
                                                </Badge>
                                            )}
                                            {group.canViewGroupActivity && (
                                                <Badge variant="outline" className="text-xs">
                                                    View Activity
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {groups.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No groups found</p>
                        <p className="text-sm text-muted-foreground">
                            Create your first group to get started
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
