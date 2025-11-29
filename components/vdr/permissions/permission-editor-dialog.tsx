"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Permission {
    canFence: boolean;
    canView: boolean;
    canDownloadEncrypted: boolean;
    canDownloadPdf: boolean;
    canDownloadOriginal: boolean;
    canUpload: boolean;
    canManage: boolean;
}

interface GroupPermission {
    group: {
        id: string;
        name: string;
        type: string;
    };
    permissions: Permission;
}

interface UserPermission {
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    permissions: Permission;
}

interface PermissionEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceName: string;
    resourceType: "document" | "folder";
    groupPermissions: GroupPermission[];
    userPermissions: UserPermission[];
    onUpdateGroupPermission: (groupId: string, permissions: Permission) => Promise<void>;
    onUpdateUserPermission: (userId: string, permissions: Permission) => Promise<void>;
    onRemoveGroupPermission: (groupId: string) => Promise<void>;
    onRemoveUserPermission: (userId: string) => Promise<void>;
}

const permissionLabels = {
    canFence: "Fence View",
    canView: "View",
    canDownloadEncrypted: "Download Encrypted",
    canDownloadPdf: "Download PDF",
    canDownloadOriginal: "Download Original",
    canUpload: "Upload",
    canManage: "Manage",
};

export function PermissionEditorDialog({
    open,
    onOpenChange,
    resourceName,
    resourceType,
    groupPermissions,
    userPermissions,
    onUpdateGroupPermission,
    onUpdateUserPermission,
    onRemoveGroupPermission,
    onRemoveUserPermission,
}: PermissionEditorDialogProps) {
    const [editingPermissions, setEditingPermissions] = useState<
        Map<string, Permission>
    >(new Map());

    const handlePermissionChange = (
        id: string,
        type: "group" | "user",
        key: keyof Permission,
        value: boolean
    ) => {
        const current =
            type === "group"
                ? groupPermissions.find((gp) => gp.group.id === id)?.permissions
                : userPermissions.find((up) => up.user.id === id)?.permissions;

        if (!current) return;

        const updated = { ...current, [key]: value };
        setEditingPermissions(new Map(editingPermissions.set(id, updated)));
    };

    const handleSave = async (id: string, type: "group" | "user") => {
        const permissions = editingPermissions.get(id);
        if (!permissions) return;

        try {
            if (type === "group") {
                await onUpdateGroupPermission(id, permissions);
            } else {
                await onUpdateUserPermission(id, permissions);
            }
            editingPermissions.delete(id);
            setEditingPermissions(new Map(editingPermissions));
        } catch (error) {
            console.error("Error saving permissions:", error);
        }
    };

    const getDisplayPermissions = (
        id: string,
        defaultPermissions: Permission
    ): Permission => {
        return editingPermissions.get(id) || defaultPermissions;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Manage Permissions</DialogTitle>
                    <DialogDescription>
                        {resourceType === "document" ? "Document" : "Folder"}: {resourceName}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="groups" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="groups">
                            Group Permissions ({groupPermissions.length})
                        </TabsTrigger>
                        <TabsTrigger value="users">
                            User Overrides ({userPermissions.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups" className="space-y-4">
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group</TableHead>
                                        {Object.entries(permissionLabels).map(([key, label]) => (
                                            <TableHead key={key} className="text-center">
                                                {label}
                                            </TableHead>
                                        ))}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupPermissions.map((gp) => {
                                        const perms = getDisplayPermissions(
                                            gp.group.id,
                                            gp.permissions
                                        );
                                        const hasChanges = editingPermissions.has(gp.group.id);

                                        return (
                                            <TableRow key={gp.group.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{gp.group.name}</p>
                                                        <Badge variant="outline" className="mt-1">
                                                            {gp.group.type}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                {Object.keys(permissionLabels).map((key) => (
                                                    <TableCell key={key} className="text-center">
                                                        <Checkbox
                                                            checked={perms[key as keyof Permission]}
                                                            onCheckedChange={(checked) =>
                                                                handlePermissionChange(
                                                                    gp.group.id,
                                                                    "group",
                                                                    key as keyof Permission,
                                                                    checked as boolean
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {hasChanges && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSave(gp.group.id, "group")}
                                                            >
                                                                Save
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => onRemoveGroupPermission(gp.group.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        {Object.entries(permissionLabels).map(([key, label]) => (
                                            <TableHead key={key} className="text-center">
                                                {label}
                                            </TableHead>
                                        ))}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userPermissions.map((up) => {
                                        const perms = getDisplayPermissions(
                                            up.user.id,
                                            up.permissions
                                        );
                                        const hasChanges = editingPermissions.has(up.user.id);

                                        return (
                                            <TableRow key={up.user.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {up.user.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {up.user.email}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                {Object.keys(permissionLabels).map((key) => (
                                                    <TableCell key={key} className="text-center">
                                                        <Checkbox
                                                            checked={perms[key as keyof Permission]}
                                                            onCheckedChange={(checked) =>
                                                                handlePermissionChange(
                                                                    up.user.id,
                                                                    "user",
                                                                    key as keyof Permission,
                                                                    checked as boolean
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {hasChanges && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSave(up.user.id, "user")}
                                                            >
                                                                Save
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => onRemoveUserPermission(up.user.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
