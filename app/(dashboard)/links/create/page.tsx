"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link2, Loader2, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function CreateLinkPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const documentId = searchParams?.get("documentId");

    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocId, setSelectedDocId] = useState(documentId || "");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [allowDownload, setAllowDownload] = useState(true);
    const [allowNotification, setAllowNotification] = useState(true);
    const [emailProtected, setEmailProtected] = useState(false);
    const [emailAuthenticated, setEmailAuthenticated] = useState(false);
    const [enableTracking, setEnableTracking] = useState(true);
    const [enableFeedback, setEnableFeedback] = useState(false);
    const [allowedEmails, setAllowedEmails] = useState("");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdLink, setCreatedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            // We need to get all documents from user's teams
            const response = await fetch("/api/teams");
            const teamsData = await response.json();

            if (teamsData.success) {
                const allDocs: any[] = [];

                for (const team of teamsData.data) {
                    const docsResponse = await fetch(`/api/documents?teamId=${team.id}`);
                    const docsData = await docsResponse.json();
                    if (docsData.success) {
                        allDocs.push(...docsData.data);
                    }
                }

                setDocuments(allDocs);
            }
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDocId) {
            setError("Please select a document");
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const emailList = allowedEmails
                .split(",")
                .map(e => e.trim())
                .filter(e => e);

            const response = await fetch("/api/links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId: selectedDocId,
                    name,
                    description,
                    password: password || undefined,
                    expiresAt: expiresAt || undefined,
                    allowDownload,
                    allowNotification,
                    emailProtected,
                    emailAuthenticated,
                    enableTracking,
                    enableFeedback,
                    allowedEmails: emailList,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create link");
            }

            // Generate full URL
            const fullUrl = `${window.location.origin}/view/${data.data.slug}`;
            setCreatedLink(fullUrl);
        } catch (err: any) {
            setError(err.message || "An error occurred while creating the link");
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = () => {
        if (createdLink) {
            navigator.clipboard.writeText(createdLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 max-w-2xl flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (createdLink) {
        return (
            <div className="container mx-auto py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Check className="h-6 w-6 text-green-500" />
                            Link Created Successfully!
                        </CardTitle>
                        <CardDescription>
                            Your shareable link is ready. Copy it and share with anyone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shareable Link</Label>
                            <div className="flex gap-2">
                                <Input value={createdLink} readOnly className="font-mono text-sm" />
                                <Button onClick={copyToClipboard} variant="outline">
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button onClick={() => router.push("/links")} className="flex-1">
                                View All Links
                            </Button>
                            <Button
                                onClick={() => {
                                    setCreatedLink(null);
                                    setName("");
                                    setDescription("");
                                    setPassword("");
                                    setExpiresAt("");
                                }}
                                variant="outline"
                            >
                                Create Another
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Create Share Link</h1>
                <p className="text-muted-foreground">
                    Generate a secure link to share your document
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Document Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Document</CardTitle>
                        <CardDescription>Select the document to share</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedDocId} onValueChange={setSelectedDocId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a document" />
                            </SelectTrigger>
                            <SelectContent>
                                {documents.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                        {doc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Link Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Link Details</CardTitle>
                        <CardDescription>Customize your share link</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Link Name (Optional)</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Proposal for Client"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what this link is for"
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>Control access to your document</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password Protection (Optional)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter a password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                            <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Protection</Label>
                                <p className="text-sm text-muted-foreground">
                                    Require email to access
                                </p>
                            </div>
                            <Switch
                                checked={emailProtected}
                                onCheckedChange={setEmailProtected}
                            />
                        </div>

                        {emailProtected && (
                            <div className="space-y-2">
                                <Label htmlFor="emails">Allowed Emails (comma-separated)</Label>
                                <Input
                                    id="emails"
                                    value={allowedEmails}
                                    onChange={(e) => setAllowedEmails(e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Verification</Label>
                                <p className="text-sm text-muted-foreground">
                                    Send verification code to email
                                </p>
                            </div>
                            <Switch
                                checked={emailAuthenticated}
                                onCheckedChange={setEmailAuthenticated}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>Set viewer permissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow Download</Label>
                                <p className="text-sm text-muted-foreground">
                                    Viewers can download the document
                                </p>
                            </div>
                            <Switch
                                checked={allowDownload}
                                onCheckedChange={setAllowDownload}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Tracking</Label>
                                <p className="text-sm text-muted-foreground">
                                    Track views and analytics
                                </p>
                            </div>
                            <Switch
                                checked={enableTracking}
                                onCheckedChange={setEnableTracking}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Send notifications on view
                                </p>
                            </div>
                            <Switch
                                checked={allowNotification}
                                onCheckedChange={setAllowNotification}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Feedback</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow viewers to leave feedback
                                </p>
                            </div>
                            <Switch
                                checked={enableFeedback}
                                onCheckedChange={setEnableFeedback}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={creating || !selectedDocId}
                        className="flex-1"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Link...
                            </>
                        ) : (
                            <>
                                <Link2 className="mr-2 h-4 w-4" />
                                Create Share Link
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
