"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnhancedSecureViewer } from "@/components/viewer/enhanced-secure-viewer";
import { Download, X, ExternalLink, Loader2, FileText, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentViewerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: {
        id: string;
        name: string;
        fileType: string;
        size?: number;
        url?: string;
    } | null;
    userName?: string;
    userEmail?: string;
    allowDownload?: boolean;
}

export function DocumentViewerDialog({
    open,
    onOpenChange,
    document,
    userName = "User",
    userEmail = "user@example.com",
    allowDownload = true,
}: DocumentViewerDialogProps) {
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch document URL when dialog opens
    const fetchDocumentUrl = useCallback(async () => {
        if (!document?.id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/documents/${document.id}/view`);
            if (!response.ok) {
                throw new Error("Failed to get document URL");
            }
            const data = await response.json();
            setDocumentUrl(data.url);
        } catch (err) {
            console.error("Error fetching document URL:", err);
            setError(err instanceof Error ? err.message : "Failed to load document");
        } finally {
            setLoading(false);
        }
    }, [document?.id]);

    // Fetch URL when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen && document?.id) {
            fetchDocumentUrl();
        } else {
            setDocumentUrl(null);
            setError(null);
        }
        onOpenChange(newOpen);
    };

    // Download handler
    const handleDownload = async () => {
        if (!document?.id) return;

        try {
            const response = await fetch(`/api/documents/${document.id}/download`);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.href = url;
            a.download = document.name;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);
        } catch (err) {
            console.error("Download error:", err);
        }
    };

    // Format file size
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get file type badge color
    const getFileTypeBadge = (fileType: string) => {
        const type = fileType.toLowerCase();
        if (type.includes("pdf")) return "bg-red-100 text-red-700";
        if (type.includes("word") || type.includes("doc")) return "bg-blue-100 text-blue-700";
        if (type.includes("excel") || type.includes("spreadsheet") || type.includes("xls")) return "bg-green-100 text-green-700";
        if (type.includes("image")) return "bg-purple-100 text-purple-700";
        if (type.includes("powerpoint") || type.includes("ppt")) return "bg-orange-100 text-orange-700";
        return "bg-muted text-muted-foreground";
    };

    // Get short file type
    const getShortFileType = (fileType: string, name: string): string => {
        if (fileType.includes("/")) {
            const parts = fileType.split("/");
            const ext = parts[parts.length - 1];
            if (ext && ext !== "octet-stream") return ext.toUpperCase();
        }
        const nameParts = name.split(".");
        if (nameParts.length > 1) return nameParts[nameParts.length - 1].toUpperCase();
        return "FILE";
    };

    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold truncate">{document.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className={getFileTypeBadge(document.fileType)}>
                                    {getShortFileType(document.fileType, document.name)}
                                </Badge>
                                {document.size && (
                                    <span>{formatFileSize(document.size)}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3 text-success" />
                                    Secure View
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {allowDownload && (
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/documents/${document.id}/view?redirect=true`, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 h-[calc(90vh-80px)] overflow-hidden">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">Loading document...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8">
                                <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Failed to load document</h3>
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <Button onClick={fetchDocumentUrl}>Retry</Button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && documentUrl && (
                        <EnhancedSecureViewer
                            documentUrl={documentUrl}
                            documentName={document.name}
                            fileType={document.fileType}
                            userName={userName}
                            userEmail={userEmail}
                            allowDownload={allowDownload}
                            allowPrint={false}
                            allowCopy={false}
                            enableWatermark={true}
                            enableScreenshotProtection={false}
                            watermarkOpacity={0.08}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
