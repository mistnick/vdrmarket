"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, Monitor, Clock, Volume2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
    id?: string;
    emailEnabled: boolean;
    emailLinkViewed: boolean;
    emailDocumentShared: boolean;
    emailTeamInvitation: boolean;
    emailCommentMention: boolean;
    emailQAActivity: boolean;
    inAppEnabled: boolean;
    desktopEnabled: boolean;
    digestEnabled: boolean;
    digestFrequency: string;
    digestTime: string;
    soundEnabled: boolean;
}

export default function NotificationSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        emailEnabled: true,
        emailLinkViewed: true,
        emailDocumentShared: true,
        emailTeamInvitation: true,
        emailCommentMention: true,
        emailQAActivity: true,
        inAppEnabled: true,
        desktopEnabled: false,
        digestEnabled: false,
        digestFrequency: "daily",
        digestTime: "09:00",
        soundEnabled: true,
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/notifications/preferences");
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setPreferences(result.data);
                }
            }
        } catch (error) {
            console.error("Error fetching preferences:", error);
            toast.error("Failed to load notification preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch("/api/notifications/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preferences),
            });

            if (response.ok) {
                toast.success("Notification preferences updated successfully");
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Error saving preferences:", error);
            toast.error("Failed to save notification preferences");
        } finally {
            setSaving(false);
        }
    };

    const requestDesktopPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setPreferences({ ...preferences, desktopEnabled: true });
                toast.success("Desktop notifications enabled");
            } else {
                toast.error("Desktop notifications require browser permission");
            }
        } else {
            toast.error("Desktop notifications are not supported in this browser");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
                <p className="text-slate-600 mt-1">
                    Manage how and when you receive notifications
                </p>
            </div>

            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <CardTitle>Email Notifications</CardTitle>
                    </div>
                    <CardDescription>
                        Choose which activities trigger email notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Master Email Toggle */}
                    <div className="flex items-center justify-between pb-4 border-b">
                        <div>
                            <Label htmlFor="email-enabled" className="font-medium">
                                Enable Email Notifications
                            </Label>
                            <p className="text-sm text-slate-500 mt-1">
                                Master control for all email notifications
                            </p>
                        </div>
                        <Switch
                            id="email-enabled"
                            checked={preferences.emailEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, emailEnabled: checked })
                            }
                        />
                    </div>

                    {/* Individual Email Settings */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-link-viewed" className="text-sm">
                                Link views
                            </Label>
                            <Switch
                                id="email-link-viewed"
                                checked={preferences.emailLinkViewed}
                                disabled={!preferences.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailLinkViewed: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-document-shared" className="text-sm">
                                Document shares
                            </Label>
                            <Switch
                                id="email-document-shared"
                                checked={preferences.emailDocumentShared}
                                disabled={!preferences.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailDocumentShared: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-team-invitation" className="text-sm">
                                Team invitations
                            </Label>
                            <Switch
                                id="email-team-invitation"
                                checked={preferences.emailTeamInvitation}
                                disabled={!preferences.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailTeamInvitation: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-comment-mention" className="text-sm">
                                Comment mentions
                            </Label>
                            <Switch
                                id="email-comment-mention"
                                checked={preferences.emailCommentMention}
                                disabled={!preferences.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailCommentMention: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-qa-activity" className="text-sm">
                                Q&A activity
                            </Label>
                            <Switch
                                id="email-qa-activity"
                                checked={preferences.emailQAActivity}
                                disabled={!preferences.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, emailQAActivity: checked })
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <CardTitle>In-App Notifications</CardTitle>
                    </div>
                    <CardDescription>
                        Notifications within the application
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="in-app-enabled" className="font-medium">
                                Enable In-App Notifications
                            </Label>
                            <p className="text-sm text-slate-500 mt-1">
                                Show notifications in the notification bell
                            </p>
                        </div>
                        <Switch
                            id="in-app-enabled"
                            checked={preferences.inAppEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, inAppEnabled: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                            <Label htmlFor="sound-enabled" className="font-medium flex items-center gap-2">
                                <Volume2 className="h-4 w-4" />
                                Notification Sound
                            </Label>
                            <p className="text-sm text-slate-500 mt-1">
                                Play a sound when you receive a notification
                            </p>
                        </div>
                        <Switch
                            id="sound-enabled"
                            checked={preferences.soundEnabled}
                            disabled={!preferences.inAppEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, soundEnabled: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Desktop Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-purple-600" />
                        <CardTitle>Desktop Notifications</CardTitle>
                    </div>
                    <CardDescription>
                        Browser notifications even when the app is in the background
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="desktop-enabled" className="font-medium">
                                Enable Desktop Notifications
                            </Label>
                            <p className="text-sm text-slate-500 mt-1">
                                Requires browser permission
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!preferences.desktopEnabled && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={requestDesktopPermission}
                                >
                                    Request Permission
                                </Button>
                            )}
                            <Switch
                                id="desktop-enabled"
                                checked={preferences.desktopEnabled}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, desktopEnabled: checked })
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Digest */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <CardTitle>Notification Digest</CardTitle>
                    </div>
                    <CardDescription>
                        Receive a summary of notifications instead of individual emails
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="digest-enabled" className="font-medium">
                                Enable Digest
                            </Label>
                            <p className="text-sm text-slate-500 mt-1">
                                Consolidate notifications into periodic summaries
                            </p>
                        </div>
                        <Switch
                            id="digest-enabled"
                            checked={preferences.digestEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, digestEnabled: checked })
                            }
                        />
                    </div>

                    {preferences.digestEnabled && (
                        <div className="space-y-3 pt-3 border-t">
                            <div>
                                <Label htmlFor="digest-frequency" className="text-sm font-medium">
                                    Frequency
                                </Label>
                                <Select
                                    value={preferences.digestFrequency}
                                    onValueChange={(value) =>
                                        setPreferences({ ...preferences, digestFrequency: value })
                                    }
                                >
                                    <SelectTrigger id="digest-frequency" className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="digest-time" className="text-sm font-medium">
                                    Delivery Time
                                </Label>
                                <Select
                                    value={preferences.digestTime}
                                    onValueChange={(value) =>
                                        setPreferences({ ...preferences, digestTime: value })
                                    }
                                >
                                    <SelectTrigger id="digest-time" className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="06:00">6:00 AM</SelectItem>
                                        <SelectItem value="09:00">9:00 AM</SelectItem>
                                        <SelectItem value="12:00">12:00 PM</SelectItem>
                                        <SelectItem value="15:00">3:00 PM</SelectItem>
                                        <SelectItem value="18:00">6:00 PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
