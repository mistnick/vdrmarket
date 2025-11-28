"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, RotateCcw, FileText, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DocumentVersion {
    id: string;
    versionNumber: number;
    fileName: string | null;
    fileType: string | null;
    fileSize: number;
    comment: string | null;
    createdAt: string;
    createdBy: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface VersionHistoryDialogProps {
    documentId: string;
    currentVersion: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVersionRestored?: () => void;
}

export function VersionHistoryDialog({
    documentId,
    currentVersion,
    open,
    onOpenChange,
    onVersionRestored,
}: VersionHistoryDialogProps) {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [restoringId, setRestoringId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchVersions();
        }
    }, [open, documentId]);

    const fetchVersions = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/documents/${documentId}/versions`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch versions");
            }

            setVersions(data.versions);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId: string, versionNumber: number) => {
        if (
            !confirm(
                `Are you sure you want to restore to version ${versionNumber}? This will create a new version.`
            )
        ) {
            return;
        }

        setRestoringId(versionId);
        setError("");

        try {
            const response = await fetch(
                `/api/documents/${documentId}/versions/${versionId}/restore`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to restore version");
            }

            // Refresh versions list
            await fetchVersions();
            onVersionRestored?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRestoringId(null);
        }
    };

    const handleDownload = async (versionId: string) => {
        try {
            const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Find the version to get the filename
                const version = versions.find(v => v.id === versionId);
                a.download = version?.fileName || 'document';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error("Error downloading version:", error);
            toast.error("Failed to download version");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Version History</DialogTitle>
                    <DialogDescription>
                        View and restore previous versions of this document
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No version history available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Timeline */}
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                            {versions.map((version, index) => (
                                <div key={version.id} className="relative flex gap-4 mb-6">
                                    {/* Timeline dot */}
                                    <div
                                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${version.versionNumber === currentVersion
                                            ? "bg-success/10 border-success"
                                            : "bg-background border-border"
                                            }`}
                                    >
                                        <span
                                            className={`text-sm font-bold ${version.versionNumber === currentVersion
                                                ? "text-success"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            v{version.versionNumber}
                                        </span>
                                    </div>

                                    {/* Version details */}
                                    <div className="flex-1 pt-1">
                                        <div className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium">
                                                            {version.fileName || "Untitled"}
                                                        </h4>
                                                        {version.versionNumber === currentVersion && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {version.createdBy.name ||
                                                                version.createdBy.email}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {formatDistanceToNow(new Date(version.createdAt), {
                                                                addSuffix: true,
                                                            })}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatFileSize(version.fileSize)}</span>
                                                    </div>
                                                </div>

                                                {version.versionNumber !== currentVersion && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(version.id)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRestore(version.id, version.versionNumber)
                                                            }
                                                            disabled={restoringId === version.id}
                                                        >
                                                            {restoringId === version.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                                    Restore
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {version.comment && (
                                                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                                                    {version.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
