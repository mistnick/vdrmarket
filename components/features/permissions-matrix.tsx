'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Shield, Eye, Edit, UserCheck } from 'lucide-react';
import { toast } from '@/lib/utils/toast'; // Assuming you have a toast utility

type Permission = {
    id: string;
    email: string;
    level: 'viewer' | 'editor' | 'admin';
    createdAt: Date;
};

type PermissionsMatrixProps = {
    dataRoomId: string;
    permissions: Permission[];
    onPermissionAdded?: (permission: Permission) => void;
    onPermissionRemoved?: (permissionId: string) => void;
    onPermissionUpdated?: (permissionId: string, level: string) => void;
};

const PERMISSION_LEVELS = {
    viewer: {
        label: 'Viewer',
        description: 'Can view documents only',
        icon: Eye,
        color: 'text-info',
    },
    editor: {
        label: 'Editor',
        description: 'Can view and upload documents',
        icon: Edit,
        color: 'text-success',
    },
    admin: {
        label: 'Admin',
        description: 'Full access including permissions',
        icon: Shield,
        color: 'text-primary',
    },
};

export function PermissionsMatrix({
    dataRoomId,
    permissions,
    onPermissionAdded,
    onPermissionRemoved,
    onPermissionUpdated,
}: PermissionsMatrixProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newLevel, setNewLevel] = useState<'viewer' | 'editor' | 'admin'>('viewer');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddPermission = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/permissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: newEmail,
                    level: newLevel,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add permission');
            }

            const permission = await response.json();
            onPermissionAdded?.(permission);

            setNewEmail('');
            setNewLevel('viewer');
            setIsAddDialogOpen(false);
            toast.success('Permission added successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add permission');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePermission = async (permissionId: string, email: string) => {
        if (!confirm(`Remove access for ${email}?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/permissions/${permissionId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove permission');
            }

            onPermissionRemoved?.(permissionId);
            toast.success('Permission removed successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove permission');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePermission = async (permissionId: string, email: string, newLevel: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/permissions/${permissionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ level: newLevel }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update permission');
            }

            onPermissionUpdated?.(permissionId, newLevel);
            toast.success('Permission updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update permission');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>
                            Manage who can access this data room
                        </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Permission
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Permission</DialogTitle>
                                <DialogDescription>
                                    Grant access to a user by email address
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="level">Permission Level</Label>
                                    <Select value={newLevel} onValueChange={(value: any) => setNewLevel(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PERMISSION_LEVELS).map(([key, { label, description }]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{label}</span>
                                                        <span className="text-xs text-muted-foreground">{description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddPermission} disabled={isLoading}>
                                    {isLoading ? 'Adding...' : 'Add Permission'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {permissions.length === 0 ? (
                    <div className="text-center py-8">
                        <UserCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <p className="text-muted-foreground">No permissions set</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Add permissions to grant users access to this data room
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {permissions.map((permission) => {
                            const levelInfo = PERMISSION_LEVELS[permission.level];
                            const Icon = levelInfo.icon;

                            return (
                                <div
                                    key={permission.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full bg-accent ${levelInfo.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{permission.email}</p>
                                            <p className="text-sm text-muted-foreground">{levelInfo.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={permission.level}
                                            onValueChange={(value) =>
                                                handleUpdatePermission(permission.id, permission.email, value)
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(PERMISSION_LEVELS).map(([key, { label }]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemovePermission(permission.id, permission.email)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
