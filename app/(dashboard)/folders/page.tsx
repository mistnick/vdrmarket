"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Folder,
    Search,
    FileText,
    Loader2,
    FolderOpen,
    MoreVertical,
    Trash2,
    FolderPlus,
} from "lucide-react";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";

interface FolderData {
    id: string;
    name: string;
    description?: string;
    path: string;
    createdAt: string;
    owner: {
        name: string | null;
        email: string;
    };
    _count: {
        documents: number;
        children: number;
    };
}

export default function FoldersPage() {
    const router = useRouter();
    const { authFetch } = useAuthFetch();
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [teamId, setTeamId] = useState<string>("");

    // Fetch team ID
    useEffect(() => {
        async function fetchTeam() {
            const { data, error } = await authFetch<{ id: string }>("/api/teams/current");
            if (data?.id) {
                setTeamId(data.id);
            } else if (error) {
                console.error("Error fetching team:", error);
            }
        }
        fetchTeam();
    }, [authFetch]);

    // Fetch folders
    useEffect(() => {
        if (!teamId) return;

        async function fetchFolders() {
            setLoading(true);
            const { data, error } = await authFetch<{ data: FolderData[] }>(`/api/folders?teamId=${teamId}`);
            
            if (data?.data) {
                setFolders(data.data);
            } else if (error) {
                console.error("Error fetching folders:", error);
                toast.error("Failed to fetch folders");
            }
            setLoading(false);
        }

        fetchFolders();
    }, [teamId, authFetch]);

    const handleDelete = useCallback(async (folderId: string, folderName: string) => {
        if (!confirm(`Are you sure you want to delete "${folderName}"?`)) {
            return;
        }

        const { error } = await authFetch(`/api/folders/${folderId}`, {
            method: "DELETE",
        });

        if (!error) {
            toast.success("Folder deleted successfully");
            setFolders(prev => prev.filter((f) => f.id !== folderId));
        } else {
            toast.error("Failed to delete folder");
        }
    }, [authFetch]);
    
    const refreshFolders = useCallback(async () => {
        if (!teamId) return;
        const { data } = await authFetch<{ data: FolderData[] }>(`/api/folders?teamId=${teamId}`);
        if (data?.data) {
            setFolders(data.data);
        }
    }, [teamId, authFetch]);

    const filteredFolders = folders.filter((folder) =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalFolders = folders.length;
    const totalDocuments = folders.reduce((sum, f) => sum + f._count.documents, 0);
    const totalSubfolders = folders.reduce((sum, f) => sum + f._count.children, 0);

    const breadcrumbs = [
        { label: "Home", href: "/dashboard" },
        { label: "Folders" },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Folders"
                description="Organize your documents in folders"
                breadcrumbs={breadcrumbs}
                actions={
                    <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Folder
                    </Button>
                }
            />

            {/* Stats Row */}
            {!loading && folders.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Folders"
                        value={totalFolders.toString()}
                        icon={Folder}
                    />
                    <StatCard
                        title="Total Documents"
                        value={totalDocuments.toString()}
                        icon={FileText}
                    />
                    <StatCard
                        title="Total Subfolders"
                        value={totalSubfolders.toString()}
                        icon={FolderOpen}
                    />
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 bg-card p-1 rounded-lg border border-border/60">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search folders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-none shadow-none focus-visible:ring-0 h-9"
                    />
                </div>
                <div className="flex items-center gap-1 pr-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Folders Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
            ) : filteredFolders.length === 0 ? (
                <Card className="border-gray-200">
                    <CardContent className="p-0">
                        <EmptyState
                            icon={FolderOpen}
                            title={searchQuery ? "No folders found" : "No folders yet"}
                            description={
                                searchQuery
                                    ? "Try adjusting your search query"
                                    : "Create your first folder to organize documents"
                            }
                            action={
                                !searchQuery
                                    ? {
                                        label: "Create Folder",
                                        onClick: () => setDialogOpen(true),
                                    }
                                    : undefined
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFolders.map((folder) => (
                        <Card
                            key={folder.id}
                            className="border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => router.push(`/folders/${folder.id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                                        <Folder className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-gray-100"
                                            >
                                                <MoreVertical className="h-4 w-4 text-gray-600" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="border-gray-200">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/folders/${folder.id}`);
                                                }}
                                            >
                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                Open
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(folder.id, folder.name);
                                                }}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h3 className="font-semibold text-base text-gray-900 mb-1 truncate">
                                    {folder.name}
                                </h3>
                                {folder.description && (
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                        {folder.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>{folder._count.documents} docs</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Folder className="h-3.5 w-3.5" />
                                        <span>{folder._count.children} folders</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Created {format(new Date(folder.createdAt), "MMM d, yyyy")}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Folder Dialog */}
            <CreateFolderDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                teamId={teamId}
                onSuccess={() => {
                    refreshFolders();
                    setDialogOpen(false);
                }}
            />
        </div>
    );
}
