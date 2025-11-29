"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Monitor, Smartphone, Tablet, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Session {
    id: string;
    device: string;
    browser: string;
    os: string;
    ipAddress: string;
    location: string;
    lastActivity: string;
    createdAt: string;
    isCurrent: boolean;
}

export function ActiveSessionsCard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            const response = await fetch("/api/auth/sessions", {
                credentials: "include"
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch sessions");
            }

            setSessions(data.sessions);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        setRevokingId(sessionId);
        setError("");

        try {
            const response = await fetch(`/api/auth/sessions/${sessionId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to revoke session");
            }

            // Remove session from list
            setSessions(sessions.filter((s) => s.id !== sessionId));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRevokingId(null);
        }
    };

    const getDeviceIcon = (device: string) => {
        switch (device.toLowerCase()) {
            case "mobile":
                return <Smartphone className="h-4 w-4" />;
            case "tablet":
                return <Tablet className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                    Manage your active sessions across different devices and locations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No active sessions</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Device</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getDeviceIcon(session.device)}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">
                                                        {session.browser} on {session.os}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {session.device}
                                                    </span>
                                                </div>
                                                {session.isCurrent && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {session.location || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">
                                            {session.ipAddress}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(session.lastActivity), {
                                                addSuffix: true,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!session.isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevokeSession(session.id)}
                                                    disabled={revokingId === session.id}
                                                >
                                                    {revokingId === session.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <LogOut className="h-4 w-4 mr-1" />
                                                            Revoke
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {sessions.length > 1 && (
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Revoke all except current
                                        sessions
                                            .filter((s) => !s.isCurrent)
                                            .forEach((s) => handleRevokeSession(s.id));
                                    }}
                                    disabled={revokingId !== null}
                                >
                                    Revoke All Other Sessions
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
