"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSocket } from "@/components/providers/socket-provider";
import { useSession } from "next-auth/react";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { socket, isConnected } = useSocket();
    const { data: session } = useSession();

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket || !isConnected || !session?.user?.email) return;

        const handleNewNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            // Optional: Play sound or show toast
        };

        socket.on(`notification:${session.user.email}`, handleNewNotification);

        return () => {
            socket.off(`notification:${session.user.email}`, handleNewNotification);
        };
    }, [socket, isConnected, session]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications?limit=5");
            const data = await response.json();

            if (response.ok) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ read: true }),
            });

            if (response.ok) {
                await fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/notifications/read-all", {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                await fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                            className="h-8 text-xs"
                        >
                            {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <Check className="h-3 w-3 mr-1" />
                            )}
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""
                                        }`}
                                >
                                    {notification.link ? (
                                        <Link
                                            href={notification.link}
                                            onClick={() => {
                                                if (!notification.read) {
                                                    handleMarkAsRead(notification.id, {} as any);
                                                }
                                                setOpen(false);
                                            }}
                                            className="block"
                                        >
                                            <NotificationContent notification={notification} />
                                        </Link>
                                    ) : (
                                        <NotificationContent notification={notification} />
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs"
                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Mark read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            asChild
                        >
                            <Link href="/notifications">View all notifications</Link>
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function NotificationContent({ notification }: { notification: Notification }) {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
            </p>
        </div>
    );
}
