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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Mail, FileText, Loader2, Check, Eye, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

const DEFAULT_INVITATION_TEMPLATE = `<VDR_name>
<Sender_user> invited you to the project
 

Dear <Name,Surname>,
 

<Sender_Name Sender_Surname> invited you to <VDR_name>.

To enter the project you'll need to create an account. The creation may require 2-step verification, depending on <VDR_name>'s settings.

Open this link to confirm the activation and to access the environment:
<Confirmation_url>
If it doesn't work, copy and paste this link into your browser. 

Kind regards,
SimpleVDR Team

This email was sent to <recipient_addr>

<Unsubscribe>

<Privacy_policy>	<Terms_of_use>	<Help_center>	<Contact_support>
 
© 2025 SimpleVDR. All rights reserved.`;

const TEMPLATE_PLACEHOLDERS = [
    { placeholder: "<VDR_name>", description: "Name of the Virtual Data Room" },
    { placeholder: "<Sender_user>", description: "Email of the user who sent the invitation" },
    { placeholder: "<Sender_Name Sender_Surname>", description: "Full name of the sender" },
    { placeholder: "<Name,Surname>", description: "Recipient's full name" },
    { placeholder: "<Confirmation_url>", description: "Link to activate the account" },
    { placeholder: "<recipient_addr>", description: "Recipient's email address" },
    { placeholder: "<Unsubscribe>", description: "Unsubscribe link" },
    { placeholder: "<Privacy_policy>", description: "Link to privacy policy" },
    { placeholder: "<Terms_of_use>", description: "Link to terms of use" },
    { placeholder: "<Help_center>", description: "Link to help center" },
    { placeholder: "<Contact_support>", description: "Link to contact support" },
];

export default function NotificationTemplatesPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("group_invitation");
    const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
    const [editedContent, setEditedContent] = useState("");
    const [editedSubject, setEditedSubject] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState("");

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (selectedTemplate && templates.length > 0) {
            const template = templates.find(t => t.name === selectedTemplate);
            if (template) {
                setCurrentTemplate(template);
                setEditedContent(template.htmlContent);
                setEditedSubject(template.subject);
            } else {
                // Template doesn't exist yet, use defaults
                setCurrentTemplate(null);
                setEditedContent(selectedTemplate === "group_invitation" ? DEFAULT_INVITATION_TEMPLATE : "");
                setEditedSubject(selectedTemplate === "group_invitation" ? "You've been invited to join a Virtual Data Room" : "");
            }
        }
    }, [selectedTemplate, templates]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/settings/email-templates", {
                credentials: "include"
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setTemplates(result.data);
                }
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch("/api/settings/email-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: selectedTemplate,
                    subject: editedSubject,
                    htmlContent: editedContent,
                }),
            });

            if (response.ok) {
                toast.success("Template saved successfully");
                await fetchTemplates();
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to save template");
            }
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error(error instanceof Error ? error.message : "Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (selectedTemplate === "group_invitation") {
            setEditedContent(DEFAULT_INVITATION_TEMPLATE);
            setEditedSubject("You've been invited to join a Virtual Data Room");
        }
    };

    const handlePreview = () => {
        // Replace placeholders with sample values
        let preview = editedContent
            .replace(/<VDR_name>/g, "Acme Corp M&A Project")
            .replace(/<Sender_user>/g, "john.doe@company.com")
            .replace(/<Sender_Name Sender_Surname>/g, "John Doe")
            .replace(/<Name,Surname>/g, "Jane Smith")
            .replace(/<Confirmation_url>/g, "https://app.simplevdr.com/auth/activate?token=abc123")
            .replace(/<recipient_addr>/g, "jane.smith@example.com")
            .replace(/<Unsubscribe>/g, '<a href="#">Unsubscribe</a>')
            .replace(/<Privacy_policy>/g, '<a href="#">Privacy Policy</a>')
            .replace(/<Terms_of_use>/g, '<a href="#">Terms of Use</a>')
            .replace(/<Help_center>/g, '<a href="#">Help Center</a>')
            .replace(/<Contact_support>/g, '<a href="#">Contact Support</a>');
        
        setPreviewContent(preview);
        setPreviewOpen(true);
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
                <h1 className="text-2xl font-bold text-slate-900">Notification Templates</h1>
                <p className="text-slate-600 mt-1">
                    Customize email templates for notifications
                </p>
            </div>

            {/* Template Selector */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <CardTitle>Email Templates</CardTitle>
                    </div>
                    <CardDescription>
                        Select a template to customize its content
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-select">Template</Label>
                        <Select
                            value={selectedTemplate}
                            onValueChange={setSelectedTemplate}
                        >
                            <SelectTrigger id="template-select">
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="group_invitation">Group Invitation Template</SelectItem>
                                <SelectItem value="password_reset">Password Reset Template</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Template Editor */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <CardTitle>
                                {selectedTemplate === "group_invitation" ? "Group Invitation Template" : "Password Reset Template"}
                            </CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset to Default
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePreview}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                        </div>
                    </div>
                    <CardDescription>
                        Edit the template content. Use placeholders that will be replaced with actual values.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                            id="subject"
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            placeholder="Enter email subject"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Email Content</Label>
                        <Textarea
                            id="content"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Enter email content..."
                            className="min-h-[400px] font-mono text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Placeholders Reference */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-amber-600" />
                        <CardTitle>Available Placeholders</CardTitle>
                    </div>
                    <CardDescription>
                        Use these placeholders in your template. They will be replaced with actual values when sending emails.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        {TEMPLATE_PLACEHOLDERS.map((item) => (
                            <div key={item.placeholder} className="flex items-center gap-4 py-2 border-b last:border-0">
                                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-emerald-700 min-w-[200px]">
                                    {item.placeholder}
                                </code>
                                <span className="text-sm text-slate-600">{item.description}</span>
                            </div>
                        ))}
                    </div>
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
                            Save Template
                        </>
                    )}
                </Button>
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                        <DialogDescription>
                            This is how the email will look with sample data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="border rounded-lg p-4 bg-white">
                        <div className="mb-4 pb-4 border-b">
                            <p className="text-sm text-slate-500">Subject:</p>
                            <p className="font-medium">{editedSubject}</p>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {previewContent}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
