"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, FileText, Share2, Download, Trash2, Loader2, Upload } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { UploadVersionDialog } from "@/components/documents/upload-version-dialog";
import { toast } from "sonner";

interface DocumentActionsProps {
    documentId: string;
    documentName: string;
    file: string;
}

export function DocumentActions({ documentId, documentName, file }: DocumentActionsProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showUploadVersionDialog, setShowUploadVersionDialog] = useState(false);

    const handleDownload = async () => {
        try {
            const response = await fetch(`/api/documents/${documentId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = documentName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error("Error downloading document:", error);
            toast.error("Failed to download document");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete document");
            }

            toast.success("Document deleted successfully");
            router.refresh();
            setShowDeleteDialog(false);
        } catch (error: any) {
            console.error("Error deleting document:", error);
            toast.error(error.message || "Failed to delete document");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/documents/${documentId}`)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Create Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowUploadVersionDialog(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New Version
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{documentName}" and all associated links.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create Link Dialog */}
            <CreateLinkDialog
                open={showLinkDialog}
                onOpenChange={setShowLinkDialog}
                documentId={documentId}
                documentName={documentName}
                onSuccess={() => {
                    router.refresh();
                }}
            />

            {/* Upload Version Dialog */}
            <UploadVersionDialog
                open={showUploadVersionDialog}
                onOpenChange={setShowUploadVersionDialog}
                documentId={documentId}
                documentName={documentName}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </>
    );
}
