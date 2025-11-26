import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { LanguageSelector } from "@/components/settings/language-selector";

export default async function ProfileSettingsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/auth/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile and account settings.
                </p>
            </div>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details and contact information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <Button variant="outline">Change Avatar</Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue={session.name || ""} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" defaultValue={session.email} disabled />
                        </div>
                        <div className="flex justify-end">
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                <LanguageSelector />
            </div>
        </div>
    );
}
