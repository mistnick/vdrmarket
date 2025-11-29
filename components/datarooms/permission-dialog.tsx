"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Permission {
    id: string;
    email: string;
    level: "viewer" | "editor" | "admin";
}

interface PermissionDialogProps {
    dataRoomId: string;
    permission?: Permission | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PermissionDialog({
    dataRoomId,
    permission,
    open,
    onOpenChange,
    onSuccess,
}: PermissionDialogProps) {
    const [email, setEmail] = useState(permission?.email || "");
    const [level, setLevel] = useState<"viewer" | "editor" | "admin">(
        permission?.level || "viewer"
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = !!permission;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/datarooms/${dataRoomId}/permissions/${permission.id}`
                : `/api/datarooms/${dataRoomId}/permissions`;

            const method = isEdit ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: email.trim(),
                    level,
                }),
            });

            if (response.ok) {
                onSuccess();
                onOpenChange(false);
                setEmail("");
                setLevel("viewer");
            } else {
                const data = await response.json();
                setError(data.error || "Failed to save permission");
            }
        } catch (err) {
            setError("An error occurred");
            console.error("Error saving permission:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Permission" : "Add Permission"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update access level for this user"
                            : "Give someone access to this data room"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                                disabled={isEdit}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="level">Access Level</Label>
                            <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">
                                        <div>
                                            <div className="font-medium">Viewer</div>
                                            <div className="text-sm text-muted-foreground">
                                                Can view and download documents
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="editor">
                                        <div>
                                            <div className="font-medium">Editor</div>
                                            <div className="text-sm text-muted-foreground">
                                                Can upload and edit documents
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div>
                                            <div className="font-medium">Admin</div>
                                            <div className="text-sm text-muted-foreground">
                                                Full access including permissions
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !email.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update" : "Add"} Permission
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
