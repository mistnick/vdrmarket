"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface Group {
    id: string;
    name: string;
    type: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    accessType: string;
    groupMemberships: Array<{
        group: {
            id: string;
        };
    }>;
}

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    groups: Group[];
    onSubmit: (userId: string, data: any) => Promise<void>;
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    groups,
    onSubmit,
}: EditUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [accessType, setAccessType] = useState<string>("FULL");

    useEffect(() => {
        if (user) {
            setSelectedGroups(user.groupMemberships.map((gm) => gm.group.id));
            setAccessType(user.accessType);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await onSubmit(user.id, {
                groupIds: selectedGroups,
                accessType,
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        setSelectedGroups((prev) =>
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId]
        );
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User Settings</DialogTitle>
                    <DialogDescription>
                        Update settings for {user.email}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Access Type</Label>
                        <Select value={accessType} onValueChange={setAccessType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Access</SelectItem>
                                <SelectItem value="LIMITED">Limited Access</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Groups</Label>
                        <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                            {groups.map((group) => (
                                <div key={group.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`group-${group.id}`}
                                        checked={selectedGroups.includes(group.id)}
                                        onCheckedChange={() => toggleGroup(group.id)}
                                    />
                                    <Label
                                        htmlFor={`group-${group.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {group.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
