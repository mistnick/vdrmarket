'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { use as ReactUse } from 'react';

export default function InviteMemberPage({ params }: { params: Promise<{ teamId: string }> }) {
    const router = useRouter();
    const { teamId } = ReactUse(params);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        role: 'member',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/api/teams/${teamId}/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setSuccess(true);
            setFormData({ email: '', role: 'member' });

            // Redirect after short delay
            setTimeout(() => {
                router.push(`/teams/${teamId}`);
                router.refresh();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <div className="mb-6">
                <Link
                    href={`/teams/${teamId}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Team
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Invite Team Member</CardTitle>
                    </div>
                    <CardDescription>
                        Send an email invitation to add a new member to your team.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                                disabled={loading || success}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Admins can manage team settings and members. Members can edit documents. Viewers can only view.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 text-green-600 p-3 rounded-lg text-sm flex items-center">
                                <div className="h-2 w-2 bg-green-600 rounded-full mr-2" />
                                Invitation sent successfully! Redirecting...
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading || success}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || success}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Invitation'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
