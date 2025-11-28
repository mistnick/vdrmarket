"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, Check, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CreateLinkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId?: string;
    documentName?: string;
    onSuccess?: () => void;
}

export function CreateLinkDialog({
    open,
    onOpenChange,
    documentId: initialDocumentId,
    documentName: initialDocumentName,
    onSuccess,
}: CreateLinkDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>(initialDocumentId || "");
    const [documents, setDocuments] = useState<any[]>([]);
    const [fetchingDocs, setFetchingDocs] = useState(false);

    // Fetch documents if no initial document is provided
    const fetchDocuments = async () => {
        if (initialDocumentId) return;

        try {
            setFetchingDocs(true);
            const response = await fetch("/api/documents");
            const data = await response.json();
            if (data.success) {
                setDocuments(data.data);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setFetchingDocs(false);
        }
    };

    // Trigger fetch when dialog opens and no document ID is provided
    if (open && !initialDocumentId && documents.length === 0 && !fetchingDocs) {
        fetchDocuments();
    }

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        password: "",
        expiresAt: "",
        allowDownload: true,
        emailProtected: false,
        allowedEmails: "",
        enableTracking: true,
        enableFeedback: false,
    });

    const [errors, setErrors] = useState<{
        name?: string;
        password?: string;
        allowedEmails?: string;
    }>({});

    const validateStep1 = () => {
        const newErrors: typeof errors = {};

        if (!initialDocumentId && !selectedDocumentId) {
            toast.error("Please select a document");
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: typeof errors = {};

        if (formData.password && formData.password.length < 4) {
            newErrors.password = "Password must be at least 4 characters";
        }

        if (formData.emailProtected && !formData.allowedEmails.trim()) {
            newErrors.allowedEmails = "At least one email is required for email protection";
        }

        if (formData.allowedEmails.trim()) {
            const emails = formData.allowedEmails.split(",").map((e) => e.trim());
            const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emails.filter((e) => !validEmailRegex.test(e));

            if (invalidEmails.length > 0) {
                newErrors.allowedEmails = `Invalid email(s): ${invalidEmails.join(", ")}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const allowedEmails = formData.allowedEmails
                ? formData.allowedEmails.split(",").map((e) => e.trim()).filter(Boolean)
                : [];

            const response = await fetch("/api/links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId: initialDocumentId || selectedDocumentId,
                    name: formData.name.trim() || `Share link for ${initialDocumentName || documents.find(d => d.id === selectedDocumentId)?.name || "Document"}`,
                    description: formData.description.trim() || undefined,
                    password: formData.password || undefined,
                    expiresAt: formData.expiresAt || undefined,
                    allowDownload: formData.allowDownload,
                    emailProtected: formData.emailProtected,
                    allowedEmails,
                    enableTracking: formData.enableTracking,
                    enableFeedback: formData.enableFeedback,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create share link");
            }

            const linkUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/view/${result.data.slug}`;
            setGeneratedLink(linkUrl);

            toast.success("Share link created successfully");

            if (onSuccess) {
                onSuccess();
            }

            router.refresh();
        } catch (error) {
            console.error("Error creating link:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create share link"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (generatedLink) {
            try {
                await navigator.clipboard.writeText(generatedLink);
                setCopied(true);
                toast.success("Link copied to clipboard");
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                toast.error("Failed to copy link");
            }
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: "",
                description: "",
                password: "",
                expiresAt: "",
                allowDownload: true,
                emailProtected: false,
                allowedEmails: "",
                enableTracking: true,
                enableFeedback: false,
            });
            setErrors({});
            setGeneratedLink(null);
            setCopied(false);
            setCurrentStep(1);
            if (!initialDocumentId) {
                setSelectedDocumentId("");
            }
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle>Create Share Link</DialogTitle>
                    <DialogDescription>
                        {generatedLink
                            ? "Your share link has been created"
                            : `Step ${currentStep} of 3: ${currentStep === 1 ? "Document & Basic Info" : currentStep === 2 ? "Security Settings" : "Permissions & Review"}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicator */}
                {!generatedLink && (
                    <div className="flex gap-2 mb-4">
                        <div
                            className={`flex-1 h-1.5 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-muted"}`}
                        />
                        <div
                            className={`flex-1 h-1.5 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`}
                        />
                        <div
                            className={`flex-1 h-1.5 rounded-full ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`}
                        />
                    </div>
                )}

                {!generatedLink ? (
                    <div>
                        <div className="grid gap-4 py-4">
                            {/* Step 1: Document & Basic Info */}
                            {currentStep === 1 && (
                                <>
                                    {!initialDocumentId && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="document">Select Document <span className="text-destructive">*</span></Label>
                                            <select
                                                id="document"
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={selectedDocumentId}
                                                onChange={(e) => setSelectedDocumentId(e.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="">Select a document...</option>
                                                {documents.map((doc) => (
                                                    <option key={doc.id} value={doc.id}>
                                                        {doc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Link Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder={`Share link for ${initialDocumentName || "document"}`}
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Add notes about this share..."
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            disabled={loading}
                                            rows={3}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Step 2: Security Settings */}
                            {currentStep === 2 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password Protection (Optional)</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter password (min. 4 characters)"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            disabled={loading}
                                            className={errors.password ? "border-destructive" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="expiresAt">
                                            <Calendar className="inline h-4 w-4 mr-1" />
                                            Expiration Date (Optional)
                                        </Label>
                                        <Input
                                            id="expiresAt"
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) =>
                                                setFormData({ ...formData, expiresAt: e.target.value })
                                            }
                                            disabled={loading}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Email Protection</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Only allow specific email addresses
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.emailProtected}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, emailProtected: checked })
                                                }
                                                disabled={loading}
                                            />
                                        </div>

                                        {formData.emailProtected && (
                                            <div className="grid gap-2 pl-4 border-l-2">
                                                <Label htmlFor="allowedEmails">
                                                    Allowed Emails <span className="text-destructive">*</span>
                                                </Label>
                                                <Textarea
                                                    id="allowedEmails"
                                                    placeholder="email1@example.com, email2@example.com"
                                                    value={formData.allowedEmails}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, allowedEmails: e.target.value })
                                                    }
                                                    disabled={loading}
                                                    className={errors.allowedEmails ? "border-destructive" : ""}
                                                    rows={2}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Separate multiple emails with commas
                                                </p>
                                                {errors.allowedEmails && (
                                                    <p className="text-sm text-destructive">{errors.allowedEmails}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Step 3: Permissions & Review */}
                            {currentStep === 3 && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Allow Downloads</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Viewers can download the document
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.allowDownload}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, allowDownload: checked })
                                                }
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Enable Tracking</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Track views and engagement
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.enableTracking}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, enableTracking: checked })
                                                }
                                                disabled={loading}
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
                                                checked={formData.enableFeedback}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, enableFeedback: checked })
                                                }
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-info/10 border border-info/20 rounded-lg p-4 mt-2">
                                        <h4 className="font-medium text-info mb-2">Ready to create</h4>
                                        <p className="text-sm text-info/80">
                                            Your share link will be created with the configured settings.
                                            {formData.password && " Password protection is enabled."}
                                            {formData.expiresAt && ` Link expires on ${new Date(formData.expiresAt).toLocaleDateString()}.`}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                            )}
                            {currentStep < 3 ? (
                                <Button type="button" onClick={handleNext} disabled={loading}>
                                    Next
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleSubmit} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Link
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                            <h4 className="font-medium text-success mb-2">Link Created Successfully!</h4>
                            <p className="text-sm text-success/80">
                                Your share link is ready. Copy and share it with your recipients.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Share Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={generatedLink}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="flex-shrink-0"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {formData.password && (
                            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                                <p className="text-sm text-info">
                                    <strong>Password Protection:</strong> Recipients will need to enter the password you set.
                                </p>
                            </div>
                        )}

                        {formData.expiresAt && (
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                                <p className="text-sm text-warning">
                                    <strong>Expiration:</strong> Link expires on {new Date(formData.expiresAt).toLocaleString()}
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
