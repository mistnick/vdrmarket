"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit } from "lucide-react";

interface Permission {
    id: string;
    email: string;
    level: "viewer" | "editor" | "admin";
    createdAt: string;
}

interface PermissionMatrixProps {
    dataRoomId: string;
    permissions: Permission[];
    onEdit: (permission: Permission) => void;
    onDelete: (permissionId: string) => void;
}

const LEVEL_COLORS = {
    viewer: "bg-info/10 text-info hover:bg-info/10",
    editor: "bg-success/10 text-success hover:bg-success/10",
    admin: "bg-primary/10 text-primary hover:bg-primary/10",
};

const LEVEL_LABELS = {
    viewer: "Viewer",
    editor: "Editor",
    admin: "Admin",
};

export function PermissionMatrix({
    dataRoomId,
    permissions,
    onEdit,
    onDelete,
}: PermissionMatrixProps) {
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (permissionId: string) => {
        if (!confirm("Are you sure you want to remove this permission?")) return;

        setDeleting(permissionId);
        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/permissions/${permissionId}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                onDelete(permissionId);
            } else {
                alert("Failed to delete permission");
            }
        } catch (error) {
            console.error("Error deleting permission:", error);
            alert("Failed to delete permission");
        } finally {
            setDeleting(null);
        }
    };

    if (permissions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No permissions configured yet</p>
                <p className="text-sm mt-1">Add users to give them access to this data room</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {permissions.map((permission) => (
                        <TableRow key={permission.id}>
                            <TableCell className="font-medium">{permission.email}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={LEVEL_COLORS[permission.level]}>
                                    {LEVEL_LABELS[permission.level]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(permission.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={deleting === permission.id}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(permission)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Level
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(permission.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove Access
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
