"use client";

import { useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
    Dialog,
    DialogPortal,
    DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnhancedSecureViewer } from "@/components/viewer/enhanced-secure-viewer";
import { Download, X, ExternalLink, Loader2, FileText, Shield, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rnd } from "react-rnd";

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
    const [isMaximized, setIsMaximized] = useState(false);

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
            setIsMaximized(false);
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
            <DialogPortal>
                <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    {/* Hidden accessibility elements */}
                    <DialogPrimitive.Title className="sr-only">{document.name}</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Secure document viewer for {document.name}. Drag the header to move, resize from corners.
                    </DialogPrimitive.Description>

                    <Rnd
                        default={{
                            x: typeof window !== 'undefined' ? window.innerWidth / 2 - 512 : 0,
                            y: typeof window !== 'undefined' ? window.innerHeight / 2 - 384 : 0,
                            width: 1024,
                            height: 768,
                        }}
                        minWidth={600}
                        minHeight={400}
                        bounds="window"
                        dragHandleClassName="dialog-drag-handle"
                        className="pointer-events-auto"
                        disableDragging={isMaximized}
                        size={isMaximized ? { width: "100%", height: "100%" } : undefined}
                        position={isMaximized ? { x: 0, y: 0 } : undefined}
                    >
                        <div className="flex flex-col w-full h-full bg-background border rounded-lg shadow-2xl overflow-hidden">
                            {/* Header - Draggable Area */}
                            <div className="dialog-drag-handle flex items-center justify-between px-4 py-3 border-b bg-muted/30 cursor-move select-none">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <h2 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
                                            {document.name}
                                        </h2>
                                        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="secondary" className={`h-5 px-1.5 ${getFileTypeBadge(document.fileType)}`}>
                                                {getShortFileType(document.fileType, document.name)}
                                            </Badge>
                                            {document.size && (
                                                <span>{formatFileSize(document.size)}</span>
                                            )}
                                            <span className="flex items-center gap-1 ml-2 text-success">
                                                <Shield className="h-3 w-3" />
                                                Secure View
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    {allowDownload && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="Download">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => window.open(`/api/documents/${document.id}/view?redirect=true`, "_blank")}
                                        title="Open in New Tab"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setIsMaximized(!isMaximized)}
                                        title={isMaximized ? "Restore" : "Maximize"}
                                    >
                                        {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => onOpenChange(false)}
                                        title="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 relative bg-muted/10 min-h-0">
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-muted-foreground text-sm">Loading document...</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center p-8">
                                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                            <h3 className="text-base font-semibold mb-2">Failed to load document</h3>
                                            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{error}</p>
                                            <Button size="sm" onClick={fetchDocumentUrl}>Retry</Button>
                                        </div>
                                    </div>
                                )}

                                {!loading && !error && documentUrl && (
                                    <div className="h-full w-full">
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </Rnd>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
