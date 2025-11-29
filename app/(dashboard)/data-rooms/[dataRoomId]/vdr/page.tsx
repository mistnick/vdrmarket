"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GroupList } from "@/components/vdr/groups/group-list";
import { GroupFormDialog } from "@/components/vdr/groups/group-form-dialog";
import { InviteUserDialog } from "@/components/vdr/users/invite-user-dialog";
import { EditUserDialog } from "@/components/vdr/users/edit-user-dialog";
import { UserList } from "@/components/vdr/users/user-list";
import { ActivityLogView } from "@/components/vdr/activity/activity-log-view";
import { RecycleBin } from "@/components/vdr/recycle-bin/recycle-bin";
import { DocumentPermissionsManager } from "@/components/vdr/documents";

interface Group {
    id: string;
    name: string;
    description: string | null;
    type: "ADMINISTRATOR" | "USER" | "CUSTOM";
    canViewDueDiligenceChecklist: boolean;
    canManageDocumentPermissions: boolean;
    canViewGroupUsers: boolean;
    canManageUsers: boolean;
    canViewGroupActivity: boolean;
    createdAt: Date;
    updatedAt: Date;
    dataRoomId: string;
    _count: {
        members: number;
    };
}

export default function VDRManagementPage() {
    const params = useParams();
    const dataRoomId = (params?.dataRoomId as string) || "";

    const [groups, setGroups] = useState<Group[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [deletedDocuments, setDeletedDocuments] = useState<any[]>([]);
    const [deletedFolders, setDeletedFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [canManage, setCanManage] = useState(false);
    const [activityScope, setActivityScope] = useState<"self" | "group" | "all">("self");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    useEffect(() => {
        loadSession();
        loadGroups();
        loadUsers();
        loadRecycleBin();
    }, [dataRoomId]);

    useEffect(() => {
        loadActivity();
    }, [dataRoomId, activityScope]);

    const loadSession = async () => {
        try {
            const response = await fetch("/api/auth/session", {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUserId(data.userId);
            }
        } catch (error) {
            console.error("Error loading session:", error);
        }
    };

    const loadGroups = async () => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/groups`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load groups");
            const data = await response.json();
            setGroups(data);

            // Check if user can manage (has at least one ADMINISTRATOR group)
            const hasAdminGroup = data.some(
                (g: Group) => g.type === "ADMINISTRATOR"
            );
            setCanManage(hasAdminGroup);
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/users`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load users");
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Error loading users:", error);
        }
    };

    const loadActivity = useCallback(async () => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/activity?scope=${activityScope}`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load activity");
            const data = await response.json();
            setActivities(data.activities || []);
        } catch (error) {
            console.error("Error loading activity:", error);
        }
    }, [dataRoomId, activityScope]);

    const loadRecycleBin = async () => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/recycle-bin`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load recycle bin");
            const data = await response.json();
            setDeletedDocuments(data.documents || []);
            setDeletedFolders(data.folders || []);
        } catch (error) {
            console.error("Error loading recycle bin:", error);
        }
    };

    const handleCreateGroup = async (values: any) => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/groups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error("Failed to create group");

            toast.success("Group created successfully");
            await loadGroups();
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("Failed to create group");
            throw error;
        }
    };

    const handleUpdateGroup = async (values: any) => {
        if (!editingGroup) return;

        try {
            const response = await fetch(
                `/api/vdr/${dataRoomId}/groups/${editingGroup.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(values),
                }
            );

            if (!response.ok) throw new Error("Failed to update group");

            toast.success("Group updated successfully");
            await loadGroups();
        } catch (error) {
            console.error("Error updating group:", error);
            toast.error("Failed to update group");
            throw error;
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("Are you sure you want to delete this group?")) return;

        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/groups/${groupId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to delete group");

            toast.success("Group deleted successfully");
            await loadGroups();
        } catch (error) {
            console.error("Error deleting group:", error);
            toast.error("Failed to delete group");
        }
    };

    const handleInviteUser = async (values: any) => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/users/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...values, dataRoomId }),
            });

            if (!response.ok) throw new Error("Failed to invite user");

            const data = await response.json();
            toast.success(data.message || "Invitation sent successfully");
            await loadUsers();
        } catch (error) {
            console.error("Error inviting user:", error);
            toast.error("Failed to send invitation");
            throw error;
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setEditUserDialogOpen(true);
    };

    const handleUpdateUser = async (userId: string, data: any) => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to update user");

            toast.success("User updated successfully");
            await loadUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
            throw error;
        }
    };

    const handleDeactivateUser = async (userId: string) => {
        // Check if user is an admin and if it's the last one
        const user = users.find(u => u.id === userId);
        if (user) {
            const isAdmin = user.groupMemberships.some((gm: any) => gm.group.type === "ADMINISTRATOR");
            if (isAdmin) {
                const activeAdmins = users.filter(u =>
                    u.isActive &&
                    u.groupMemberships.some((gm: any) => gm.group.type === "ADMINISTRATOR")
                );

                if (activeAdmins.length <= 1) {
                    toast.error("Cannot deactivate the last administrator");
                    return;
                }
            }
        }

        if (!confirm("Are you sure you want to deactivate this user?")) return;
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/users/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to deactivate user");
            toast.success("User deactivated");
            await loadUsers();
        } catch (error) {
            console.error("Error deactivating user:", error);
            toast.error("Failed to deactivate user");
        }
    };

    const handleResendInvite = async (email: string) => {
        try {
            await handleInviteUser({ email, groupIds: [] });
            toast.success("Invitation resent");
        } catch (error) {
            console.error("Error resending invite:", error);
        }
    };

    const handleActivityFilterChange = (filters: any) => {
        // Apply filters - could be implemented with API params
        console.log("Activity filters:", filters);
    };

    const handleExportActivity = async () => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/activity/export`);
            if (!response.ok) throw new Error("Failed to export");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `activity-log-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Activity log exported");
        } catch (error) {
            console.error("Error exporting activity:", error);
            toast.error("Failed to export activity log");
        }
    };

    const handleRestoreItem = async (type: "document" | "folder", itemId: string) => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/recycle-bin/restore`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, itemId }),
            });
            if (!response.ok) throw new Error("Failed to restore item");
            toast.success("Item restored successfully");
            await loadRecycleBin();
        } catch (error) {
            console.error("Error restoring item:", error);
            toast.error("Failed to restore item");
        }
    };

    const handlePermanentDelete = async (type: "document" | "folder", itemId: string) => {
        try {
            const response = await fetch(`/api/vdr/${dataRoomId}/recycle-bin/${itemId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            if (!response.ok) throw new Error("Failed to delete item");
            toast.success("Item permanently deleted");
            await loadRecycleBin();
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error("Failed to delete item");
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">VDR Management</h1>
                <p className="text-muted-foreground">
                    Manage groups, users, and permissions for this data room
                </p>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="groups">
                    <GroupList
                        dataRoomId={dataRoomId}
                        groups={groups}
                        onCreateGroup={() => {
                            setEditingGroup(null);
                            setGroupDialogOpen(true);
                        }}
                        onEditGroup={(group) => {
                            setEditingGroup(group);
                            setGroupDialogOpen(true);
                        }}
                        onDeleteGroup={handleDeleteGroup}
                        canManage={canManage}
                        currentUserGroupIds={
                            currentUserId
                                ? users
                                    .find((u) => u.id === currentUserId)
                                    ?.groupMemberships.map((gm: any) => gm.group.id) || []
                                : []
                        }
                    />
                </TabsContent>

                <TabsContent value="users">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Users</h2>
                                <p className="text-muted-foreground">
                                    Manage user access and permissions
                                </p>
                            </div>
                            {canManage && (
                                <button
                                    onClick={() => setInviteDialogOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Invite User
                                </button>
                            )}
                        </div>
                        <UserList
                            users={users}
                            onEditUser={handleEditUser}
                            onDeactivateUser={handleDeactivateUser}
                            onResendInvite={handleResendInvite}
                            canManage={canManage}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="activity">
                    <ActivityLogView
                        activities={activities}
                        scope={activityScope}
                        onScopeChange={setActivityScope}
                        onFilterChange={handleActivityFilterChange}
                        onExport={handleExportActivity}
                        canViewAll={canManage}
                        canViewGroup={true}
                    />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentPermissionsManager
                        dataRoomId={dataRoomId}
                        groups={groups.map((g) => ({ id: g.id, name: g.name, type: g.type }))}
                        canManage={canManage}
                    />
                </TabsContent>

                <TabsContent value="recycle-bin">
                    <RecycleBin
                        documents={deletedDocuments}
                        folders={deletedFolders}
                        onRestore={handleRestoreItem}
                        onPermanentDelete={handlePermanentDelete}
                    />
                </TabsContent>
            </Tabs>

            <GroupFormDialog
                open={groupDialogOpen}
                onOpenChange={setGroupDialogOpen}
                onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
                initialData={
                    editingGroup
                        ? {
                            ...editingGroup,
                            description: editingGroup.description || undefined,
                        }
                        : undefined
                }
                mode={editingGroup ? "edit" : "create"}
            />

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSubmit={handleInviteUser}
                groups={groups.map((g) => ({ id: g.id, name: g.name, type: g.type }))}
            />

            <EditUserDialog
                open={editUserDialogOpen}
                onOpenChange={setEditUserDialogOpen}
                user={editingUser}
                groups={groups.map((g) => ({ id: g.id, name: g.name, type: g.type }))}
                onSubmit={handleUpdateUser}
            />
        </div>
    );
}
