'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Users } from 'lucide-react';

interface InvitationDetails {
    teamName: string;
    role: string;
    inviterEmail: string;
    expiresAt: string;
}

export default function TeamInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        params.then(p => setToken(p.token));
    }, [params]);

    useEffect(() => {
        if (!token) return;

        // Validate token and fetch invitation details
        fetch(`/api/teams/invitations/validate/${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setInvitation(data.invitation);
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load invitation');
                setLoading(false);
            });
    }, [token]);

    const handleAccept = async () => {
        setAccepting(true);
        setError(null);

        try {
            const res = await fetch(`/api/teams/invitations/accept/${token}`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setAccepted(true);
            setTimeout(() => {
                router.push(`/teams/${data.teamId}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            setAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (!confirm('Are you sure you want to decline this invitation?')) {
            return;
        }

        try {
            await fetch(`/api/teams/invitations/decline/${token}`, {
                method: 'POST',
            });

            router.push('/dashboard');
        } catch (err) {
            setError('Failed to decline invitation');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                        <p className="text-center text-muted-foreground mt-4">Loading invitation...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <Card className="w-full max-w-md border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-destructive" />
                            <CardTitle>Invalid Invitation</CardTitle>
                        </div>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (accepted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <Card className="w-full max-w-md border-green-500">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <CardTitle>Invitation Accepted!</CardTitle>
                        </div>
                        <CardDescription>
                            You've successfully joined the team. Redirecting...
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-6 w-6 text-purple-600" />
                        <CardTitle>Team Invitation</CardTitle>
                    </div>
                    <CardDescription>
                        You've been invited to join a team on DataRoom
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Team Name</p>
                            <p className="font-semibold text-lg">{invitation?.teamName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="font-semibold capitalize">{invitation?.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Invited by</p>
                            <p className="font-semibold">{invitation?.inviterEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Expires</p>
                            <p className="font-semibold">
                                {invitation?.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleDecline}
                        disabled={accepting}
                    >
                        Decline
                    </Button>
                    <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={handleAccept}
                        disabled={accepting}
                    >
                        {accepting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Accepting...
                            </>
                        ) : (
                            'Accept Invitation'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
