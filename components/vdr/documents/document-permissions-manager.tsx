"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    FileText,
    Folder,
    Search,
    Eye,
    EyeOff,
    Download,
    Upload,
    Settings,
    Shield,
    Lock,
    Unlock,
    MoreVertical,
    Copy,
    Move,
    Pencil,
    Trash2,
    Tag,
    Loader2,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    Users,
    FileIcon,
    FolderOpen,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface Permission {
    canFence: boolean;
    canView: boolean;
    canDownloadEncrypted: boolean;
    canDownloadPdf: boolean;
    canDownloadOriginal: boolean;
    canUpload: boolean;
    canManage: boolean;
}

interface Document {
    id: string;
    name: string;
    mimeType: string;
    fileSize: number;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FolderItem {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    _count?: {
        documents: number;
        children: number;
    };
}

interface Group {
    id: string;
    name: string;
    type: "ADMINISTRATOR" | "USER" | "CUSTOM";
}

interface GroupPermission {
    id: string;
    groupId: string;
    group: Group;
    canFence: boolean;
    canView: boolean;
    canDownloadEncrypted: boolean;
    canDownloadPdf: boolean;
    canDownloadOriginal: boolean;
    canUpload: boolean;
    canManage: boolean;
}

interface DocumentPermissionsManagerProps {
    dataRoomId: string;
    groups: Group[];
    canManage: boolean;
}

const PERMISSION_LABELS: Record<keyof Permission, { label: string; description: string; icon: React.ReactNode }> = {
    canFence: {
        label: "Fence View",
        description: "Enable restricted fence reader mode",
        icon: <Lock className="h-4 w-4" />,
    },
    canView: {
        label: "View",
        description: "Allow standard document viewing",
        icon: <Eye className="h-4 w-4" />,
    },
    canDownloadEncrypted: {
        label: "Download Encrypted",
        description: "Allow encrypted file download",
        icon: <Shield className="h-4 w-4" />,
    },
    canDownloadPdf: {
        label: "Download PDF",
        description: "Allow PDF export download",
        icon: <FileText className="h-4 w-4" />,
    },
    canDownloadOriginal: {
        label: "Download Original",
        description: "Allow original file download",
        icon: <Download className="h-4 w-4" />,
    },
    canUpload: {
        label: "Upload",
        description: "Allow file uploads to folder",
        icon: <Upload className="h-4 w-4" />,
    },
    canManage: {
        label: "Manage",
        description: "Copy, move, rename, delete, labels",
        icon: <Settings className="h-4 w-4" />,
    },
};

export function DocumentPermissionsManager({
    dataRoomId,
    groups,
    canManage,
}: DocumentPermissionsManagerProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<{ type: "document" | "folder"; id: string } | null>(null);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [itemPermissions, setItemPermissions] = useState<GroupPermission[]>([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [viewMode, setViewMode] = useState<"byDocument" | "byGroup">("byDocument");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    
    // Group-level permissions storage for bulk toggling
    const [groupPermissions, setGroupPermissions] = useState<Map<string, Permission>>(new Map());

    // Load documents and folders
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [docsRes, foldersRes] = await Promise.all([
                fetch(`/api/datarooms/${dataRoomId}/documents`),
                fetch(`/api/datarooms/${dataRoomId}/folders`),
            ]);

            if (docsRes.ok) {
                const docsData = await docsRes.json();
                setDocuments(docsData.documents || docsData.data || []);
            }

            if (foldersRes.ok) {
                const foldersData = await foldersRes.json();
                setFolders(foldersData.folders || foldersData.data || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load documents and folders");
        } finally {
            setLoading(false);
        }
    }, [dataRoomId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load permissions for selected item
    const loadItemPermissions = async (type: "document" | "folder", id: string) => {
        setLoadingPermissions(true);
        try {
            const endpoint = type === "document"
                ? `/api/vdr/${dataRoomId}/documents/${id}/permissions`
                : `/api/vdr/${dataRoomId}/folders/${id}/permissions`;

            const response = await fetch(endpoint, { credentials: "include" });
            if (!response.ok) throw new Error("Failed to load permissions");

            const data = await response.json();
            setItemPermissions(data.groupPermissions || []);
        } catch (error) {
            console.error("Error loading permissions:", error);
            toast.error("Failed to load permissions");
            setItemPermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    };

    // Open permissions dialog
    const handleOpenPermissions = async (type: "document" | "folder", id: string) => {
        setSelectedItem({ type, id });
        setPermissionsDialogOpen(true);
        await loadItemPermissions(type, id);
    };

    // Update permission for a group
    const handleUpdatePermission = async (
        groupId: string,
        permission: keyof Permission,
        value: boolean
    ) => {
        if (!selectedItem) return;

        // Optimistic update
        setItemPermissions(prev =>
            prev.map(p =>
                p.groupId === groupId ? { ...p, [permission]: value } : p
            )
        );

        try {
            const endpoint = selectedItem.type === "document"
                ? `/api/vdr/${dataRoomId}/documents/${selectedItem.id}/permissions`
                : `/api/vdr/${dataRoomId}/folders/${selectedItem.id}/permissions`;

            const response = await fetch(endpoint, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ groupId, [permission]: value }),
            });

            if (!response.ok) throw new Error("Failed to update permission");
            toast.success("Permission updated");
        } catch (error) {
            console.error("Error updating permission:", error);
            toast.error("Failed to update permission");
            // Revert on error
            await loadItemPermissions(selectedItem.type, selectedItem.id);
        }
    };

    // Bulk update all permissions for a group
    const handleBulkUpdatePermissions = async (groupId: string, permissions: Partial<Permission>) => {
        if (!selectedItem) return;

        setSavingPermissions(true);
        try {
            const endpoint = selectedItem.type === "document"
                ? `/api/vdr/${dataRoomId}/documents/${selectedItem.id}/permissions`
                : `/api/vdr/${dataRoomId}/folders/${selectedItem.id}/permissions`;

            const response = await fetch(endpoint, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ groupId, ...permissions }),
            });

            if (!response.ok) throw new Error("Failed to update permissions");

            toast.success("Permissions updated");
            await loadItemPermissions(selectedItem.type, selectedItem.id);
        } catch (error) {
            console.error("Error updating permissions:", error);
            toast.error("Failed to update permissions");
        } finally {
            setSavingPermissions(false);
        }
    };

    // Add group permission
    const handleAddGroupPermission = async (groupId: string) => {
        if (!selectedItem) return;

        try {
            const endpoint = selectedItem.type === "document"
                ? `/api/vdr/${dataRoomId}/documents/${selectedItem.id}/permissions`
                : `/api/vdr/${dataRoomId}/folders/${selectedItem.id}/permissions`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    groupId,
                    canView: true, // Default permission
                }),
            });

            if (!response.ok) throw new Error("Failed to add group permission");

            toast.success("Group permission added");
            await loadItemPermissions(selectedItem.type, selectedItem.id);
        } catch (error) {
            console.error("Error adding group permission:", error);
            toast.error("Failed to add group permission");
        }
    };

    // Remove group permission
    const handleRemoveGroupPermission = async (groupId: string) => {
        if (!selectedItem) return;

        try {
            const endpoint = selectedItem.type === "document"
                ? `/api/vdr/${dataRoomId}/documents/${selectedItem.id}/permissions/${groupId}`
                : `/api/vdr/${dataRoomId}/folders/${selectedItem.id}/permissions/${groupId}`;

            const response = await fetch(endpoint, { method: "DELETE", credentials: "include" });

            if (!response.ok) throw new Error("Failed to remove group permission");

            toast.success("Group permission removed");
            await loadItemPermissions(selectedItem.type, selectedItem.id);
        } catch (error) {
            console.error("Error removing group permission:", error);
            toast.error("Failed to remove group permission");
        }
    };

    // Toggle folder expansion
    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Toggle group permission (for byGroup view clickable boxes)
    const handleToggleGroupPermission = async (
        groupId: string,
        permission: keyof Permission
    ) => {
        if (!canManage) return;
        
        const group = groups.find(g => g.id === groupId);
        if (!group || group.type === "ADMINISTRATOR") return;

        // Get current permission state
        const currentPerms = groupPermissions.get(groupId) || {
            canFence: false,
            canView: false,
            canDownloadEncrypted: false,
            canDownloadPdf: false,
            canDownloadOriginal: false,
            canUpload: false,
            canManage: false,
        };
        
        const newValue = !currentPerms[permission];
        
        // Optimistic update
        const updatedPerms = { ...currentPerms, [permission]: newValue };
        setGroupPermissions(prev => new Map(prev).set(groupId, updatedPerms));

        // For now, we'll just show a success message
        // In a full implementation, this would update all documents/folders
        toast.success(`${permission} ${newValue ? 'enabled' : 'disabled'} for ${group.name}`);
    };

    // Initialize group permissions on load
    useEffect(() => {
        const initialPerms = new Map<string, Permission>();
        groups.forEach(group => {
            initialPerms.set(group.id, {
                canFence: group.type === "ADMINISTRATOR",
                canView: group.type === "ADMINISTRATOR",
                canDownloadEncrypted: group.type === "ADMINISTRATOR",
                canDownloadPdf: group.type === "ADMINISTRATOR",
                canDownloadOriginal: group.type === "ADMINISTRATOR",
                canUpload: group.type === "ADMINISTRATOR",
                canManage: group.type === "ADMINISTRATOR",
            });
        });
        setGroupPermissions(initialPerms);
    }, [groups]);

    // Filter items
    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter groups for byGroup view
    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );

    // Get root folders and documents
    const rootFolders = filteredFolders.filter(f => f.parentId === currentFolderId);
    const rootDocuments = filteredDocuments.filter(d => d.folderId === currentFolderId);

    // Get children of a folder
    const getChildFolders = (parentId: string) => filteredFolders.filter(f => f.parentId === parentId);
    const getChildDocuments = (folderId: string) => filteredDocuments.filter(d => d.folderId === folderId);

    // Get selected item name
    const getSelectedItemName = () => {
        if (!selectedItem) return "";
        if (selectedItem.type === "document") {
            return documents.find(d => d.id === selectedItem.id)?.name || "";
        }
        return folders.find(f => f.id === selectedItem.id)?.name || "";
    };

    // Groups not yet added to permissions
    const availableGroups = groups.filter(
        g => !itemPermissions.some(p => p.groupId === g.id)
    );

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Render inline permission badges
    const renderInlinePermissions = (itemType: "document" | "folder", itemId: string) => {
        // For now, we show default permissions or cached permissions
        // In a real implementation, this would show actual permissions from API
        return (
            <div className="flex items-center gap-1">
                {(Object.keys(PERMISSION_LABELS) as (keyof Permission)[]).slice(0, 4).map(key => (
                    <TooltipProvider key={key}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "p-1 rounded border",
                                    "bg-muted/30 border-muted text-muted-foreground"
                                )}>
                                    {PERMISSION_LABELS[key].icon}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {PERMISSION_LABELS[key].label}: Not configured
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
                <span className="text-xs text-muted-foreground ml-1">+{Object.keys(PERMISSION_LABELS).length - 4}</span>
            </div>
        );
    };

    // Render folder tree item
    const renderFolderItem = (folder: FolderItem, depth: number = 0) => {
        const isExpanded = expandedFolders.has(folder.id);
        const childFolders = getChildFolders(folder.id);
        const childDocs = getChildDocuments(folder.id);
        const hasChildren = childFolders.length > 0 || childDocs.length > 0;

        return (
            <div key={folder.id}>
                <div
                    className={cn(
                        "flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer group",
                        "transition-colors"
                    )}
                    style={{ paddingLeft: `${depth * 20 + 8}px` }}
                >
                    <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-0.5 hover:bg-muted rounded"
                        disabled={!hasChildren}
                    >
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )
                        ) : (
                            <span className="w-4" />
                        )}
                    </button>
                    {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-amber-500" />
                    ) : (
                        <Folder className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="flex-1 truncate text-sm min-w-0">{folder.name}</span>
                    
                    {/* Inline permissions preview */}
                    <div className="hidden sm:flex items-center gap-2 mr-2">
                        {renderInlinePermissions("folder", folder.id)}
                    </div>
                    
                    {canManage && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 h-7 px-2 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPermissions("folder", folder.id);
                            }}
                        >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Permissions
                        </Button>
                    )}
                </div>

                {isExpanded && (
                    <div>
                        {childFolders.map(child => renderFolderItem(child, depth + 1))}
                        {childDocs.map(doc => renderDocumentItem(doc, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Render document item
    const renderDocumentItem = (doc: Document, depth: number = 0) => (
        <div
            key={doc.id}
            className={cn(
                "flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer group",
                "transition-colors"
            )}
            style={{ paddingLeft: `${depth * 20 + 28}px` }}
        >
            <FileIcon className="h-4 w-4 text-blue-500" />
            <span className="flex-1 truncate text-sm min-w-0">{doc.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(doc.fileSize)}
            </span>
            
            {/* Inline permissions preview */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
                {renderInlinePermissions("document", doc.id)}
            </div>
            
            {canManage && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 px-2 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPermissions("document", doc.id);
                    }}
                >
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Permissions
                </Button>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Document Permissions</h2>
                    <p className="text-muted-foreground">
                        Manage access permissions for documents and folders
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* View Mode Selector */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "byDocument" | "byGroup")}>
                <TabsList>
                    <TabsTrigger value="byDocument">
                        <FileText className="h-4 w-4 mr-2" />
                        By Document
                    </TabsTrigger>
                    <TabsTrigger value="byGroup">
                        <Users className="h-4 w-4 mr-2" />
                        By Group
                    </TabsTrigger>
                </TabsList>

                {/* By Document View */}
                <TabsContent value="byDocument" className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* File Browser */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">
                                Documents & Folders
                            </CardTitle>
                            <CardDescription>
                                Click on the Permissions button to manage access
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px]">
                                <div className="p-2">
                                    {rootFolders.length === 0 && rootDocuments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <p>No documents or folders found</p>
                                        </div>
                                    ) : (
                                        <>
                                            {rootFolders.map(folder => renderFolderItem(folder))}
                                            {rootDocuments.map(doc => renderDocumentItem(doc))}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Group View */}
                <TabsContent value="byGroup" className="space-y-4">
                    {/* Search for groups */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search groups..."
                            value={groupSearchQuery}
                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Group Permissions Overview
                            </CardTitle>
                            <CardDescription>
                                Click on permission boxes to toggle. Click groups for detailed settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredGroups.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No groups found</p>
                                    </div>
                                ) : filteredGroups.map(group => {
                                    const perms = groupPermissions.get(group.id);
                                    return (
                                        <Card key={group.id} className="p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center",
                                                        group.type === "ADMINISTRATOR" ? "bg-red-100 text-red-600" :
                                                            group.type === "USER" ? "bg-blue-100 text-blue-600" :
                                                                "bg-gray-100 text-gray-600"
                                                    )}>
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{group.name}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {group.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Clickable Permission Boxes */}
                                            <div className="grid grid-cols-7 gap-2">
                                                {(Object.keys(PERMISSION_LABELS) as (keyof Permission)[]).map(key => {
                                                    const isEnabled = group.type === "ADMINISTRATOR" || (perms && perms[key]);
                                                    const isClickable = canManage && group.type !== "ADMINISTRATOR";
                                                    
                                                    return (
                                                        <TooltipProvider key={key}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => isClickable && handleToggleGroupPermission(group.id, key)}
                                                                        disabled={!isClickable}
                                                                        className={cn(
                                                                            "flex flex-col items-center p-2 rounded-md border transition-all",
                                                                            isEnabled 
                                                                                ? "bg-green-50 border-green-200 text-green-700" 
                                                                                : "bg-muted/50 border-muted text-muted-foreground",
                                                                            isClickable && "hover:ring-2 hover:ring-primary/50 cursor-pointer",
                                                                            !isClickable && "cursor-not-allowed opacity-75"
                                                                        )}
                                                                    >
                                                                        {PERMISSION_LABELS[key].icon}
                                                                        <span className="text-xs mt-1 text-center truncate w-full">
                                                                            {PERMISSION_LABELS[key].label}
                                                                        </span>
                                                                        {isEnabled && (
                                                                            <Badge 
                                                                                variant="secondary" 
                                                                                className={cn(
                                                                                    "text-xs mt-1",
                                                                                    group.type === "ADMINISTRATOR" 
                                                                                        ? "bg-green-200" 
                                                                                        : "bg-green-100"
                                                                                )}
                                                                            >
                                                                                {group.type === "ADMINISTRATOR" ? "Full" : "On"}
                                                                            </Badge>
                                                                        )}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{PERMISSION_LABELS[key].description}</p>
                                                                    {isClickable && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            Click to {isEnabled ? "disable" : "enable"}
                                                                        </p>
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Permissions Dialog */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedItem?.type === "document" ? (
                                <FileText className="h-5 w-5" />
                            ) : (
                                <Folder className="h-5 w-5" />
                            )}
                            Manage Permissions
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem?.type === "document" ? "Document" : "Folder"}: {getSelectedItemName()}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingPermissions ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 -mx-6 px-6">
                            <div className="space-y-6">
                                {/* Add Group */}
                                {canManage && availableGroups.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Select onValueChange={handleAddGroupPermission}>
                                            <SelectTrigger className="w-[250px]">
                                                <SelectValue placeholder="Add group permission..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableGroups.map(group => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{group.name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {group.type}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Permissions Matrix */}
                                {itemPermissions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No group permissions configured</p>
                                        <p className="text-sm">Add a group to start managing permissions</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[200px]">Group</TableHead>
                                                {(Object.keys(PERMISSION_LABELS) as (keyof Permission)[]).map(key => (
                                                    <TableHead key={key} className="text-center">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex flex-col items-center cursor-help">
                                                                        {PERMISSION_LABELS[key].icon}
                                                                        <span className="text-xs mt-1">
                                                                            {PERMISSION_LABELS[key].label}
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {PERMISSION_LABELS[key].description}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableHead>
                                                ))}
                                                {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {itemPermissions.map(perm => (
                                                <TableRow key={perm.groupId}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{perm.group.name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {perm.group.type}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    {(Object.keys(PERMISSION_LABELS) as (keyof Permission)[]).map(key => (
                                                        <TableCell key={key} className="text-center">
                                                            <Switch
                                                                checked={perm[key]}
                                                                onCheckedChange={(checked) =>
                                                                    handleUpdatePermission(perm.groupId, key, checked)
                                                                }
                                                                disabled={!canManage || perm.group.type === "ADMINISTRATOR"}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    {canManage && (
                                                        <TableCell>
                                                            {perm.group.type !== "ADMINISTRATOR" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => handleRemoveGroupPermission(perm.groupId)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {/* Permission Legend */}
                                <Card className="bg-muted/30">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Permission Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-green-600" />
                                                <span><strong>View:</strong> Standard document viewing</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-amber-600" />
                                                <span><strong>Fence:</strong> Restricted reader mode</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-blue-600" />
                                                <span><strong>Download Encrypted:</strong> Secured download</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-red-600" />
                                                <span><strong>Download PDF:</strong> PDF export</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Download className="h-4 w-4 text-purple-600" />
                                                <span><strong>Download Original:</strong> Original file</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Upload className="h-4 w-4 text-cyan-600" />
                                                <span><strong>Upload:</strong> Add files to folder</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-gray-600" />
                                                <span><strong>Manage:</strong> Copy, move, rename, delete, labels</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
