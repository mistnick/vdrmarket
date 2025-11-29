'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface ManagePermissionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    dataRoomId: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
    // Documents
    { id: 'documents.create', name: 'Create Documents', description: 'Upload and create new documents', category: 'Documents' },
    { id: 'documents.edit', name: 'Edit Documents', description: 'Modify existing documents', category: 'Documents' },
    { id: 'documents.delete', name: 'Delete Documents', description: 'Remove documents', category: 'Documents' },
    { id: 'documents.view', name: 'View Documents', description: 'Access and view documents', category: 'Documents' },
    
    // Links
    { id: 'links.create', name: 'Create Links', description: 'Generate sharing links', category: 'Links' },
    { id: 'links.manage', name: 'Manage Links', description: 'Edit and delete links', category: 'Links' },
    
    // Data Rooms
    { id: 'datarooms.create', name: 'Create Data Rooms', description: 'Create new data rooms', category: 'Data Rooms' },
    { id: 'datarooms.manage', name: 'Manage Data Rooms', description: 'Edit and delete data rooms', category: 'Data Rooms' },
    
    // Members
    { id: 'members.invite', name: 'Invite Members', description: 'Send data room invitations', category: 'Members' },
    { id: 'members.manage_roles', name: 'Manage Roles', description: 'Change member roles', category: 'Members' },
    { id: 'members.view', name: 'View Members', description: 'See data room member list', category: 'Members' },
    
    // Analytics
    { id: 'analytics.view', name: 'View Analytics', description: 'Access analytics and insights', category: 'Analytics' },
];

export function ManagePermissionsDialog({
    open,
    onOpenChange,
    userId,
    userName,
    dataRoomId,
}: ManagePermissionsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open && userId && dataRoomId) {
            fetchUserPermissions();
        }
    }, [open, userId, dataRoomId]);

    const fetchUserPermissions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${userId}/permissions?dataRoomId=${dataRoomId}`, {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedPermissions(new Set(data.permissions.map((p: any) => p.permission)));
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (permissionId: string) => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(permissionId)) {
                next.delete(permissionId);
            } else {
                next.add(permissionId);
            }
            return next;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch(`/api/users/${userId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    dataRoomId,
                    permissions: Array.from(selectedPermissions),
                }),
            });

            if (response.ok) {
                toast.success('Permissions updated successfully');
                onOpenChange(false);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update permissions');
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            toast.error('Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        View Permissions
                    </DialogTitle>
                    <DialogDescription>
                        Permissions for <strong>{userName}</strong> are based on their role. Change the user's role to modify their permissions.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                            <Card key={category} className="border-border/60">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {permissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className="flex items-start space-x-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                id={permission.id}
                                                checked={selectedPermissions.has(permission.id)}
                                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                disabled={true}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={permission.id}
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    {permission.name}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {permission.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
