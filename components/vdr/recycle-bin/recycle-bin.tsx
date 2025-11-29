"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, RotateCcw, File, Folder } from "lucide-react";
import { format } from "date-fns";

interface DeletedItem {
    id: string;
    name: string;
    deletedAt: Date;
    deletedBy?: {
        name: string | null;
        email: string;
    };
    fileType?: string;
    fileSize?: number;
}

interface RecycleBinProps {
    documents: DeletedItem[];
    folders: DeletedItem[];
    onRestore: (type: "document" | "folder", itemId: string) => Promise<void>;
    onPermanentDelete: (type: "document" | "folder", itemId: string) => Promise<void>;
}

export function RecycleBin({
    documents,
    folders,
    onRestore,
    onPermanentDelete,
}: RecycleBinProps) {
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleRestore = async (type: "document" | "folder", itemId: string) => {
        if (!confirm("Are you sure you want to restore this item?")) return;

        setRestoringId(itemId);
        try {
            await onRestore(type, itemId);
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = async (
        type: "document" | "folder",
        itemId: string
    ) => {
        if (
            !confirm(
                "Are you sure you want to permanently delete this item? This action cannot be undone."
            )
        )
            return;

        setDeletingId(itemId);
        try {
            await onPermanentDelete(type, itemId);
        } finally {
            setDeletingId(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">Recycle Bin</h2>
                <p className="text-muted-foreground">
                    Restore or permanently delete items
                </p>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList>
                    <TabsTrigger value="documents">
                        <File className="mr-2 h-4 w-4" />
                        Documents ({documents.length})
                    </TabsTrigger>
                    <TabsTrigger value="folders">
                        <Folder className="mr-2 h-4 w-4" />
                        Folders ({folders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documents">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Deleted By</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <File className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{doc.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {doc.fileType && (
                                                    <Badge variant="outline">{doc.fileType.toUpperCase()}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {doc.fileSize && formatFileSize(doc.fileSize)}
                                            </TableCell>
                                            <TableCell>
                                                {doc.deletedBy && (
                                                    <div>
                                                        <p className="text-sm">
                                                            {doc.deletedBy.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.deletedBy.email}
                                                        </p>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(doc.deletedAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRestore("document", doc.id)}
                                                        disabled={restoringId === doc.id}
                                                    >
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        {restoringId === doc.id ? "Restoring..." : "Restore"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handlePermanentDelete("document", doc.id)}
                                                        disabled={deletingId === doc.id}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {deletingId === doc.id ? "Deleting..." : "Delete"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {documents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <File className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-lg font-medium">No deleted documents</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="folders">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Deleted By</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {folders.map((folder) => (
                                        <TableRow key={folder.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Folder className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{folder.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {folder.deletedBy && (
                                                    <div>
                                                        <p className="text-sm">
                                                            {folder.deletedBy.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {folder.deletedBy.email}
                                                        </p>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(folder.deletedAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRestore("folder", folder.id)}
                                                        disabled={restoringId === folder.id}
                                                    >
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        {restoringId === folder.id ? "Restoring..." : "Restore"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            handlePermanentDelete("folder", folder.id)
                                                        }
                                                        disabled={deletingId === folder.id}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {deletingId === folder.id ? "Deleting..." : "Delete"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {folders.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-lg font-medium">No deleted folders</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
