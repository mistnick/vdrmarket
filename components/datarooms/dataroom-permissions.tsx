"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, User, Eye } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Permission {
    id: string;
    email: string;
    level: string;
    createdAt: string;
}

interface DataRoomPermissionsProps {
    dataRoomId: string;
}

export function DataRoomPermissions({ dataRoomId }: DataRoomPermissionsProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newLevel, setNewLevel] = useState<string>("viewer");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchPermissions();
    }, [dataRoomId]);

    const fetchPermissions = async () => {
        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/permissions`);
            const data = await response.json();

            if (data.success) {
                setPermissions(data.data);
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const addPermission = async () => {
        if (!newEmail) return;

        setAdding(true);
        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/permissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail,
                    level: newLevel,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPermissions([...permissions, data.data]);
                setNewEmail("");
                setNewLevel("viewer");
            } else {
                alert(data.error || "Failed to add permission");
            }
        } catch (error) {
            console.error("Error adding permission:", error);
            alert("Failed to add permission");
        } finally {
            setAdding(false);
        }
    };

    const removePermission = async (id: string) => {
        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/permissions/${id}`,
                { method: "DELETE" }
            );

            if (response.ok) {
                setPermissions(permissions.filter((p) => p.id !== id));
                setDeleteId(null);
            } else {
                const data = await response.json();
                alert(data.error || "Failed to remove permission");
            }
        } catch (error) {
            console.error("Error removing permission:", error);
            alert("Failed to remove permission");
        }
    };

    const updatePermissionLevel = async (id: string, level: string) => {
        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/permissions/${id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ level }),
                }
            );

            if (response.ok) {
                setPermissions(
                    permissions.map((p) => (p.id === id ? { ...p, level } : p))
                );
            } else {
                const data = await response.json();
                alert(data.error || "Failed to update permission");
            }
        } catch (error) {
            console.error("Error updating permission:", error);
            alert("Failed to update permission");
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case "admin":
                return <Shield className="h-4 w-4" />;
            case "editor":
                return <User className="h-4 w-4" />;
            default:
                return <Eye className="h-4 w-4" />;
        }
    };

    const getLevelBadgeVariant = (level: string): "default" | "secondary" | "outline" => {
        switch (level) {
            case "admin":
                return "default";
            case "editor":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Access Permissions</CardTitle>
                        <CardDescription>
                            Manage who can access this data room
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Permission Form */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            type="email"
                        />
                    </div>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={addPermission} disabled={adding || !newEmail}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>

                {/* Permissions List */}
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Loading permissions...
                    </div>
                ) : permissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No specific permissions set</p>
                        <p className="text-sm">All team members have access</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {permissions.map((permission) => (
                            <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{permission.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Added {new Date(permission.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={permission.level}
                                        onValueChange={(level) =>
                                            updatePermissionLevel(permission.id, level)
                                        }
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue>
                                                <div className="flex items-center gap-2">
                                                    {getLevelIcon(permission.level)}
                                                    <span className="capitalize">{permission.level}</span>
                                                </div>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="viewer">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    Viewer
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="editor">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Editor
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Admin
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteId(permission.id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Permission Levels Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Permission Levels:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                            <strong>Viewer:</strong> Can view documents
                        </p>
                        <p>
                            <strong>Editor:</strong> Can upload and edit documents
                        </p>
                        <p>
                            <strong>Admin:</strong> Full access including permissions
                        </p>
                    </div>
                </div>
            </CardContent>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Permission</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this permission? This user will no
                            longer have access to this data room.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && removePermission(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
