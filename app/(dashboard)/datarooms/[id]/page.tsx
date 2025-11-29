"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    FolderOpen,
    FileText,
    Users,
    Settings,
    Plus,
    Upload,
    Lock,
    Globe,
    Eye,
    Download
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataRoomPermissions } from "@/components/datarooms/dataroom-permissions";
import { DocumentViewerDialog } from "@/components/documents/document-viewer-dialog";

export default function DataRoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [dataRoom, setDataRoom] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Document viewer states
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerDocument, setViewerDocument] = useState<any | null>(null);

    useEffect(() => {
        fetchDataRoomDetails();
    }, [unwrappedParams.id]);

    const fetchDataRoomDetails = async () => {
        try {
            // Fetch data room details
            const drResponse = await fetch(`/api/datarooms/${unwrappedParams.id}`, {
                credentials: "include"
            });
            const drData = await drResponse.json();

            if (!drResponse.ok) {
                throw new Error(drData.error || "Failed to fetch data room");
            }

            setDataRoom(drData.data);

            // Fetch documents in this data room
            const docsResponse = await fetch(`/api/datarooms/${unwrappedParams.id}/documents`, {
                credentials: "include"
            });
            if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                setDocuments(docsData.data || []);
            }

            // Fetch folders in this data room
            const foldersResponse = await fetch(`/api/datarooms/${unwrappedParams.id}/folders`, {
                credentials: "include"
            });
            if (foldersResponse.ok) {
                const foldersData = await foldersResponse.json();
                setFolders(foldersData.data || []);
            }

            // Fetch permissions
            const permsResponse = await fetch(`/api/datarooms/${unwrappedParams.id}/permissions`, {
                credentials: "include"
            });
            if (permsResponse.ok) {
                const permsData = await permsResponse.json();
                setPermissions(permsData.data || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading data room...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !dataRoom) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-500">
                            <p>Error loading data room: {error}</p>
                            <Button onClick={() => router.back()} className="mt-4">
                                Go Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{dataRoom.name}</h1>
                            {dataRoom.isPublic ? (
                                <Badge variant="secondary">
                                    <Globe className="w-3 h-3 mr-1" />
                                    Public
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Private
                                </Badge>
                            )}
                        </div>
                        {dataRoom.description && (
                            <p className="text-muted-foreground mt-1">{dataRoom.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/datarooms/${unwrappedParams.id}/settings`)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => router.push(`/datarooms/${unwrappedParams.id}/upload`)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documents.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Folders</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{folders.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{permissions.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Folders</CardTitle>
                            <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                New Folder
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {folders.map((folder: any) => (
                                <Link
                                    key={folder.id}
                                    href={`/datarooms/${unwrappedParams.id}/folders/${folder.id}`}
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <FolderOpen className="w-8 h-8 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{folder.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {folder._count?.documents || 0} files
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                        {documents.length} {documents.length === 1 ? "document" : "documents"} in this data room
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Upload documents to this data room to get started
                            </p>
                            <Button onClick={() => router.push(`/datarooms/${unwrappedParams.id}/upload`)}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc: any) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => {
                                        setViewerDocument(doc);
                                        setViewerOpen(true);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                                                {doc.versions > 1 && ` • v${doc.versions}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewerDocument(doc);
                                                setViewerOpen(true);
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/file-explorer`);
                                            }}
                                        >
                                            Open in Explorer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Permissions */}
            <DataRoomPermissions dataRoomId={unwrappedParams.id} />

            {/* Document Viewer Dialog */}
            <DocumentViewerDialog
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                document={viewerDocument ? {
                    id: viewerDocument.id,
                    name: viewerDocument.name,
                    fileType: viewerDocument.fileType || "application/octet-stream",
                    size: viewerDocument.fileSize,
                } : null}
                allowDownload={true}
            />
        </div>
    );
}
