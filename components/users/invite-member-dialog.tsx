'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    onInviteSuccess?: () => void;
}

export function InviteMemberDialog({
    open,
    onOpenChange,
    teamId,
    onInviteSuccess,
}: InviteMemberDialogProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>('member');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!teamId) {
            toast.error('Team ID is missing');
            return;
        }

        try {
            setSending(true);
            const response = await fetch(`/api/teams/${teamId}/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    role: role.toLowerCase(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Invitation sent to ${email}`);
                setEmail('');
                setRole('member');
                onOpenChange(false);
                onInviteSuccess?.();
            } else {
                toast.error(data.error || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error('Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        if (!sending) {
            setEmail('');
            setRole('member');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Send an invitation to join your team. They'll receive an email with a link to accept.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                            Email Address *
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={sending}
                                className="pl-10"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter the email address of the person you want to invite
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">
                            Role *
                        </Label>
                        <Select
                            value={role}
                            onValueChange={setRole}
                            disabled={sending}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewer">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Viewer</span>
                                        <span className="text-xs text-muted-foreground">Can view documents</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="member">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Member</span>
                                        <span className="text-xs text-muted-foreground">Can create and edit</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Admin</span>
                                        <span className="text-xs text-muted-foreground">Full access except billing</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="owner">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Owner</span>
                                        <span className="text-xs text-muted-foreground">Complete control</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Choose the access level for this team member
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={sending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={sending || !email}
                            className="gap-2"
                        >
                            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {sending ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
