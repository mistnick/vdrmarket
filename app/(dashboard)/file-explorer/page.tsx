"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Upload,
  MoreVertical,
  File,
  FileSpreadsheet,
  FileImage,
  Presentation,
  Database,
  Loader2,
  FolderPlus,
  AlertCircle,
  GripVertical,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Archive,
  Lock,
  History,
  FilePlus,
  Share2,
  Pencil,
  Eye,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { toast } from "sonner";
import { RenameDialog } from "@/components/documents/rename-dialog";
import { VersionHistoryDialog } from "@/components/documents/version-history-dialog";
import { UploadVersionDialog } from "@/components/documents/upload-version-dialog";
import { DocumentViewerDialog } from "@/components/documents/document-viewer-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataRoomContext } from "@/components/providers/dataroom-provider";
import {
  IndexCell,
  IndexColumnHeader,
  ManageIndexingDialog,
  IndexBadge,
} from "@/components/file-explorer";
import { compareIndex, getNextIndex, highlightIndexMatch } from "@/lib/utils/index-utils";
import type { IndexSortDirection, BulkIndexOperation } from "@/types/index-types";

// Types
interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder" | "dataroom";
  index: string | null; // Hierarchical index like "1.2.3"
  size?: number;
  labels?: string[];
  notes?: string;
  children?: FileItem[];
  fileType?: string;
  dataRoomId?: string;
  folderId?: string;
  parentId?: string;
  createdAt?: string;
}

interface ApiDataRoom {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: {
    documents: number;
    folders: number;
    permissions: number;
  };
}

interface ApiFolder {
  id: string;
  name: string;
  parentId: string | null;
  dataRoomId: string | null;
  path: string;
  createdAt: string;
  _count: {
    documents: number;
    children: number;
  };
}

interface ApiDocument {
  id: string;
  name: string;
  description: string | null;
  file: string;
  fileType: string;
  fileSize: number;
  folderId: string | null;
  dataRoomId: string | null;
  createdAt: string;
}

// File entry from drag&drop
type FileWithPath = File & {
  path?: string;
}

// Helper function to get file icon based on type
function getFileIcon(fileType?: string) {
  if (!fileType) return File;
  const type = fileType.toLowerCase();
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("xlsx") || type.includes("xls") || type.includes("csv")) {
    return FileSpreadsheet;
  }
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg") || type.includes("gif") || type.includes("svg")) {
    return FileImage;
  }
  if (type.includes("presentation") || type.includes("powerpoint") || type.includes("pptx") || type.includes("ppt")) {
    return Presentation;
  }
  if (type.includes("pdf") || type.includes("document") || type.includes("word") || type.includes("docx") || type.includes("doc") || type.includes("text")) {
    return FileText;
  }
  return File;
}

// Format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get file extension from fileType or name
function getFileExtension(fileType: string, name: string): string {
  if (fileType.includes("/")) {
    const parts = fileType.split("/");
    const ext = parts[parts.length - 1];
    if (ext && ext !== "octet-stream") return ext;
  }
  const nameParts = name.split(".");
  if (nameParts.length > 1) return nameParts[nameParts.length - 1];
  return "file";
}

// Flatten tree for search
function flattenTree(items: FileItem[], parentPath: string = ""): (FileItem & { path: string })[] {
  const result: (FileItem & { path: string })[] = [];
  for (const item of items) {
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    result.push({ ...item, path: currentPath });
    if (item.children) {
      result.push(...flattenTree(item.children, currentPath));
    }
  }
  return result;
}

// Navigation Tree Item Component with drag&drop
function NavTreeItem({
  item,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  onDrop,
  draggedItem,
  setDraggedItem,
}: {
  item: FileItem;
  level?: number;
  selectedId: string | null;
  onSelect: (item: FileItem) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onDrop: (targetItem: FileItem, draggedItemId: string) => void;
  draggedItem: string | null;
  setDraggedItem: (id: string | null) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  if (item.type === "file") return null;

  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedId === item.id;
  const hasChildren = item.children && item.children.some((c) => c.type !== "file");
  const isDataRoom = item.type === "dataroom";
  const isDragging = draggedItem === item.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (isDataRoom) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.setData("application/x-file-item", JSON.stringify({ id: item.id, type: item.type }));
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem && draggedItem !== item.id) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== item.id) {
      onDrop(item, draggedId);
    }
  };

  return (
    <div>
      <div
        draggable={!isDataRoom}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left cursor-pointer",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground hover:text-foreground",
          isDragOver && "ring-2 ring-primary bg-primary/10",
          isDragging && "opacity-50"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(item)}
      >
        <button
          className="p-0.5 hover:bg-black/10 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(item.id);
          }}
        >
          {hasChildren || isDataRoom ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>
        {isDataRoom ? (
          <Database className="h-4 w-4 shrink-0" />
        ) : isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 shrink-0" />
        )}
        {item.index && <IndexBadge index={item.index} />}
        <span className="truncate flex-1">{item.name}</span>
        {!isDataRoom && (
          <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
        )}
      </div>
      {isExpanded &&
        item.children
          ?.filter((c) => c.type !== "file")
          .map((child) => (
            <NavTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onDrop={onDrop}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
            />
          ))}
    </div>
  );
}

// Content Tree Row Component with drag&drop
function ContentTreeRow({
  item,
  level = 0,
  expandedIds,
  onToggleExpand,
  onNavigate,
  onDrop,
  draggedItem,
  setDraggedItem,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
  onVersionHistory,
  onUploadVersion,
  onViewDocument,
  onRename,
  canEditIndex,
  onIndexChange,
  searchQuery,
  existingIndices,
}: {
  item: FileItem;
  level?: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onNavigate: (item: FileItem) => void;
  onDrop: (targetItem: FileItem, draggedItemId: string) => void;
  draggedItem: string | null;
  setDraggedItem: (id: string | null) => void;
  isSelected: boolean;
  onSelect: (item: FileItem, selected: boolean) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  onVersionHistory: (item: FileItem) => void;
  onUploadVersion: (item: FileItem) => void;
  onViewDocument: (item: FileItem) => void;
  onRename: (item: FileItem) => void;
  canEditIndex: boolean;
  onIndexChange: (itemId: string, newIndex: string | null) => Promise<void>;
  searchQuery: string;
  existingIndices: (string | null)[];
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isExpanded = expandedIds.has(item.id);
  const isFolder = item.type === "folder";
  const isDataRoom = item.type === "dataroom";
  const isFile = item.type === "file";
  const hasChildren = (isFolder || isDataRoom) && item.children && item.children.length > 0;
  const isDragging = draggedItem === item.id;

  let FileIcon;
  if (isDataRoom) {
    FileIcon = Database;
  } else if (isFolder) {
    FileIcon = isExpanded ? FolderOpen : Folder;
  } else {
    FileIcon = getFileIcon(item.fileType);
  }

  const handleRowClick = () => {
    if (isFile) {
      onViewDocument(item);
    } else {
      onNavigate(item);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(item.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isDataRoom) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.setData("application/x-file-item", JSON.stringify({ id: item.id, type: item.type }));
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if ((isFolder || isDataRoom) && draggedItem && draggedItem !== item.id) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isFolder || isDataRoom) {
      const draggedId = e.dataTransfer.getData("text/plain");
      if (draggedId && draggedId !== item.id) {
        onDrop(item, draggedId);
      }
    }
  };

  return (
    <>
      <TableRow
        draggable={!isDataRoom}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group cursor-pointer hover:bg-muted/50 border-border/60",
          !isFile && "font-medium",
          isDragOver && "ring-2 ring-inset ring-primary bg-primary/10",
          isDragging && "opacity-50",
          isSelected && "bg-primary/5"
        )}
        onClick={handleRowClick}
      >
        <TableCell className="w-10">
          {!isDataRoom && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(item, checked === true)}
              onClick={(e) => e.stopPropagation()}
              className="ml-2"
            />
          )}
        </TableCell>
        <TableCell className="w-[100px]" onClick={(e) => e.stopPropagation()}>
          <IndexCell
            item={{ id: item.id, name: item.name, type: item.type, index: item.index }}
            canEdit={canEditIndex && !isDataRoom}
            onIndexChange={onIndexChange}
            existingIndices={existingIndices}
            searchQuery={searchQuery}
          />
        </TableCell>
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />
            {hasChildren ? (
              <button
                className="p-0.5 hover:bg-muted rounded"
                onClick={handleExpandClick}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div
              className={cn(
                "p-1.5 rounded",
                isDataRoom
                  ? "bg-purple-100 text-purple-700"
                  : isFolder
                    ? "bg-amber-100 text-amber-700"
                    : "bg-primary/10 text-primary"
              )}
            >
              <FileIcon className="h-4 w-4" />
            </div>
            <span className="text-foreground">{item.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {item.labels?.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-xs font-normal"
              >
                {label}
              </Badge>
            ))}
            {isFile && item.fileType && (
              <Badge variant="outline" className="text-xs font-normal">
                {getFileExtension(item.fileType, item.name)}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
        </TableCell>
        <TableCell className="text-muted-foreground font-mono text-xs">
          {isFile
            ? formatFileSize(item.size)
            : `${item.children?.length || 0} items`}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {item.notes || "—"}
        </TableCell>
        <TableCell className="text-right">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
            {isFile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocument(item);
                }}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {isFile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(item);
                }}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {!isDataRoom && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                title="Elimina"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isFile ? (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(item);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onVersionHistory(item);
                    }}>
                      <History className="mr-2 h-4 w-4" />
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onUploadVersion(item);
                    }}>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Upload New Version
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onRename(item);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onNavigate(item)}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Download as ZIP
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onRename(item);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded &&
        item.children?.map((child) => (
          <ContentTreeRow
            key={child.id}
            item={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onNavigate={onNavigate}
            onDrop={onDrop}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
            isSelected={isSelected}
            onSelect={onSelect}
            onDownload={onDownload}
            onDelete={onDelete}
            onVersionHistory={onVersionHistory}
            onUploadVersion={onUploadVersion}
            onViewDocument={onViewDocument}
            onRename={onRename}
            canEditIndex={canEditIndex}
            onIndexChange={onIndexChange}
            searchQuery={searchQuery}
            existingIndices={existingIndices}
          />
        ))}
    </>
  );
}

export default function FileExplorerPage() {
  const { authFetch } = useAuthFetch();
  const { setCurrentDataRoom } = useDataRoomContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // State
  const [dataRooms, setDataRooms] = useState<FileItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [navExpandedIds, setNavExpandedIds] = useState<Set<string>>(new Set());
  const [contentExpandedIds, setContentExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<"name" | "size" | "date">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIndex, setNewFolderIndex] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [downloadArchiveName, setDownloadArchiveName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);

  // Version history states
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [uploadVersionOpen, setUploadVersionOpen] = useState(false);
  const [versioningItem, setVersioningItem] = useState<FileItem | null>(null);

  // Document viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<FileItem | null>(null);

  // Index management states
  const [indexSortDirection, setIndexSortDirection] = useState<IndexSortDirection>(null);
  const [manageIndexingOpen, setManageIndexingOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("viewer");
  
  // Derive canEditIndex from user role (owner or admin can edit)
  const canEditIndex = userRole === "owner" || userRole === "admin";

  // Reset drag state when leaving window or on dragend
  useEffect(() => {
    const handleDragEnd = () => {
      setIsExternalDragOver(false);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      // Check if leaving the window
      if (e.clientX === 0 && e.clientY === 0) {
        setIsExternalDragOver(false);
      }
    };

    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("dragleave", handleWindowDragLeave);

    return () => {
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("dragleave", handleWindowDragLeave);
    };
  }, []);

  // Fetch data rooms and build tree
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: drResponse, error: drError } = await authFetch<{ data: ApiDataRoom[] }>(
        "/api/datarooms"
      );

      if (drError) {
        throw new Error(drError);
      }

      const dataRoomsData = drResponse?.data || [];
      const tree: FileItem[] = [];

      for (const dr of dataRoomsData) {
        const { data: foldersResponse } = await authFetch<{ data: ApiFolder[] }>(
          `/api/folders?dataRoomId=${dr.id}`
        );

        const { data: docsResponse } = await authFetch<{ data: ApiDocument[] }>(
          `/api/documents?dataRoomId=${dr.id}`
        );

        const allFolders = foldersResponse?.data || [];
        const allDocuments = docsResponse?.data || [];

        const drFolders = allFolders.filter((f) => f.dataRoomId === dr.id);
        const drDocuments = allDocuments.filter((d) => d.dataRoomId === dr.id);

        const folderMap = new Map<string, FileItem>();
        const rootFolders: FileItem[] = [];

        for (const folder of drFolders) {
          const folderItem: FileItem = {
            id: folder.id,
            name: folder.name,
            type: "folder",
            index: (folder as any).index || null, // Index from API
            dataRoomId: dr.id,
            parentId: folder.parentId || undefined,
            children: [],
            createdAt: folder.createdAt,
          };
          folderMap.set(folder.id, folderItem);
        }

        for (const folder of drFolders) {
          const folderItem = folderMap.get(folder.id)!;
          if (folder.parentId && folderMap.has(folder.parentId)) {
            folderMap.get(folder.parentId)!.children!.push(folderItem);
          } else {
            rootFolders.push(folderItem);
          }
        }

        for (const doc of drDocuments) {
          const docItem: FileItem = {
            id: doc.id,
            name: doc.name,
            type: "file",
            index: (doc as any).index || null, // Index from API
            size: doc.fileSize,
            fileType: doc.fileType,
            notes: doc.description || undefined,
            dataRoomId: dr.id,
            folderId: doc.folderId || undefined,
            createdAt: doc.createdAt,
          };

          if (doc.folderId && folderMap.has(doc.folderId)) {
            folderMap.get(doc.folderId)!.children!.push(docItem);
          } else {
            rootFolders.push(docItem);
          }
        }

        const dataRoomItem: FileItem = {
          id: dr.id,
          name: dr.name,
          type: "dataroom",
          index: null, // DataRooms don't have indices
          notes: dr.description || undefined,
          children: rootFolders,
          createdAt: dr.createdAt,
        };

        tree.push(dataRoomItem);
      }

      setDataRooms(tree);

      if (tree.length > 0) {
        setNavExpandedIds(new Set([tree[0].id]));
        // Sincronizza il primo dataroom nel context
        setCurrentDataRoom(tree[0].id, tree[0].name);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, [authFetch, setCurrentDataRoom]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch user permissions when selected item changes
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!selectedItem) {
        setUserRole("viewer");
        return;
      }

      const dataRoomId = selectedItem.type === "dataroom"
        ? selectedItem.id
        : selectedItem.dataRoomId;

      if (!dataRoomId) {
        setUserRole("viewer");
        return;
      }

      try {
        const { data } = await authFetch<{ role: string; canEditIndex: boolean }>(
          `/api/datarooms/${dataRoomId}/my-permissions`
        );
        setUserRole(data?.role || "viewer");
      } catch {
        setUserRole("viewer");
      }
    };

    fetchPermissions();
  }, [selectedItem, authFetch]);

  // Helper function to find item by ID in tree
  const findItemById = useCallback((items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Update selectedItem when dataRooms change to keep reference fresh
  useEffect(() => {
    if (selectedItem && dataRooms.length > 0) {
      const updatedItem = findItemById(dataRooms, selectedItem.id);
      if (updatedItem) {
        setSelectedItem(updatedItem);
      }
    }
  }, [dataRooms, selectedItem?.id, findItemById]);

  // Get current contents
  const currentContents = useMemo(() => {
    if (!selectedItem) {
      return dataRooms;
    }
    // Find fresh reference in dataRooms
    const freshItem = findItemById(dataRooms, selectedItem.id);
    return freshItem?.children || [];
  }, [selectedItem, dataRooms, findItemById]);

  // Flatten all items for search
  const allFlatItems = useMemo(() => flattenTree(dataRooms), [dataRooms]);

  // Filter by search - also matches index
  const filteredContents = useMemo(() => {
    if (!searchQuery) return currentContents;

    const query = searchQuery.toLowerCase();
    const matchingItems = allFlatItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        // Match by index (exact or prefix)
        (item.index && item.index.toLowerCase().includes(query))
    );

    return matchingItems;
  }, [currentContents, searchQuery, allFlatItems]);

  // Sort contents - with index sorting support
  const sortedContents = useMemo(() => {
    const sorted = [...filteredContents].sort((a, b) => {
      const typeOrder = { dataroom: 0, folder: 1, file: 2 };
      if (a.type !== b.type) {
        return typeOrder[a.type] - typeOrder[b.type];
      }

      // If index sorting is active, use index comparison
      if (indexSortDirection !== null) {
        // Items without index always go to the end, regardless of sort direction
        const hasIndexA = a.index !== null && a.index !== undefined && a.index !== "";
        const hasIndexB = b.index !== null && b.index !== undefined && b.index !== "";
        
        if (!hasIndexA && !hasIndexB) return 0;
        if (!hasIndexA) return 1;  // a goes to end
        if (!hasIndexB) return -1; // b goes to end
        
        const indexComparison = compareIndex(a.index, b.index);
        return indexSortDirection === "asc" ? indexComparison : -indexComparison;
      }

      let comparison = 0;
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "size") {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortColumn === "date") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredContents, sortColumn, sortDirection, indexSortDirection]);

  const toggleNavExpand = useCallback((id: string) => {
    setNavExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleContentExpand = useCallback((id: string) => {
    setContentExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSort = (column: "name" | "size" | "date") => {
    // Reset index sorting when sorting by other columns
    setIndexSortDirection(null);
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle index column sorting (cycles: null -> asc -> desc -> null)
  const handleIndexSort = () => {
    setIndexSortDirection((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  // Get existing indices in current folder for validation
  const existingIndices = useMemo(() => {
    return currentContents.map((item) => item.index);
  }, [currentContents]);

  // Handle index change for a single item
  const handleIndexChange = useCallback(
    async (itemId: string, newIndex: string | null) => {
      const item = findItemById(dataRooms, itemId);
      if (!item) return;

      try {
        const endpoint = item.type === "file"
          ? `/api/documents/${itemId}`
          : `/api/folders/${itemId}`;

        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ index: newIndex }),
        });

        if (!response.ok) {
          throw new Error("Failed to update index");
        }

        toast.success("Index updated");
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Failed to update index:", error);
        toast.error("Failed to update index");
        throw error;
      }
    },
    [dataRooms, findItemById, fetchData]
  );

  // Handle bulk index update from manage dialog
  const handleBulkIndexUpdate = useCallback(
    async (operations: BulkIndexOperation[]) => {
      try {
        // Update indices one by one (could be optimized to bulk API)
        for (const op of operations) {
          const item = findItemById(dataRooms, op.itemId);
          if (!item) continue;

          const endpoint = item.type === "file"
            ? `/api/documents/${op.itemId}`
            : `/api/folders/${op.itemId}`;

          const response = await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ index: op.newIndex || null }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update index for ${item.name}`);
          }
        }

        toast.success(`Updated ${operations.length} indices`);
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Failed to update indices:", error);
        toast.error("Failed to update indices");
        throw error;
      }
    },
    [dataRooms, findItemById, fetchData]
  );

  // Get next available index for new items
  const getNextAvailableIndex = useCallback(() => {
    return getNextIndex(existingIndices, selectedItem?.index);
  }, [existingIndices, selectedItem?.index]);

  const handleNavigate = (item: FileItem) => {
    setSelectedItem(item);
    setSearchQuery("");
    setNavExpandedIds((prev) => new Set([...prev, item.id]));
    
    // Sincronizza il dataroom nel context per i permessi
    if (item.type === "dataroom") {
      setCurrentDataRoom(item.id, item.name);
    } else if (item.dataRoomId) {
      // Per folder/file, usa il dataRoomId associato
      const dataRoom = dataRooms.find(dr => dr.id === item.dataRoomId);
      setCurrentDataRoom(item.dataRoomId, dataRoom?.name ?? null);
    }
  };

  // Create folder helper
  const createFolder = async (
    name: string,
    parentId: string | null,
    dataRoomId: string,
    index?: string | null
  ): Promise<{ id: string } | null> => {
    const payload: Record<string, string | null> = {
      name,
      dataRoomId,
    };
    if (parentId) {
      payload.parentId = parentId;
    }
    if (index) {
      payload.index = index;
    }

    const { data, error } = await authFetch<{ success: boolean; data: { id: string } }>(
      "/api/folders",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (error || !data?.data) {
      return null;
    }
    return data.data;
  };

  // Upload file helper - uses /api/upload for large files (>10MB)
  const uploadFile = async (
    file: File,
    folderId: string | null,
    dataRoomId: string,
    index?: string | null
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    formData.append("dataRoomId", dataRoomId);
    if (folderId) {
      formData.append("folderId", folderId);
    }
    if (index) {
      formData.append("index", index);
    }

    // Use Pages Router API for large files (better streaming support)
    const uploadUrl = file.size > 10 * 1024 * 1024 
      ? "/api/upload" 
      : "/api/documents";

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const result = await response.json();
    return result.success;
  };

  // Process folder upload with structure recreation
  const processFolderUpload = async (files: FileList) => {
    if (!selectedItem) {
      toast.error("Seleziona prima una Data Room o cartella");
      return;
    }

    const dataRoomId = selectedItem.type === "dataroom"
      ? selectedItem.id
      : selectedItem.dataRoomId;

    if (!dataRoomId) {
      toast.error("Data Room non trovata");
      return;
    }

    const baseParentId = selectedItem.type === "folder" ? selectedItem.id : null;
    const baseParentIndex = selectedItem.type === "folder" ? selectedItem.index : null;

    // Group files by their directory path
    const filesByPath = new Map<string, File[]>();
    const allPaths = new Set<string>();

    for (const file of Array.from(files)) {
      const relativePath = (file as FileWithPath).webkitRelativePath || file.name;
      const pathParts = relativePath.split("/");

      // Collect all directory paths
      let currentPath = "";
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
        allPaths.add(currentPath);
      }

      // Group file by its directory
      const dirPath = pathParts.slice(0, -1).join("/");
      if (!filesByPath.has(dirPath)) {
        filesByPath.set(dirPath, []);
      }
      filesByPath.get(dirPath)!.push(file);
    }

    // Sort paths to create parent folders first
    const sortedPaths = Array.from(allPaths).sort((a, b) => {
      const aDepth = a.split("/").length;
      const bDepth = b.split("/").length;
      return aDepth - bDepth;
    });

    // Create folder structure with auto-indexing
    const folderIdMap = new Map<string, string>();
    const folderIndexMap = new Map<string, string>(); // Track indices for each folder
    
    // Track used indices per parent to avoid duplicates
    const usedIndicesByParent = new Map<string, string[]>();
    usedIndicesByParent.set("", [...existingIndices.filter((i): i is string => i !== null)]);

    for (const path of sortedPaths) {
      const pathParts = path.split("/");
      const folderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");

      let parentFolderId = parentPath ? folderIdMap.get(parentPath) : baseParentId;
      let parentIndex = parentPath ? folderIndexMap.get(parentPath) : baseParentIndex;

      // Get or initialize used indices for this parent
      const parentKey = parentPath || "";
      if (!usedIndicesByParent.has(parentKey)) {
        usedIndicesByParent.set(parentKey, []);
      }
      const usedIndices = usedIndicesByParent.get(parentKey)!;

      // Calculate next index for this folder
      const folderIndex = getNextIndex(usedIndices, parentIndex);
      usedIndices.push(folderIndex);

      const newFolder = await createFolder(folderName, parentFolderId || null, dataRoomId, folderIndex);
      if (newFolder) {
        folderIdMap.set(path, newFolder.id);
        folderIndexMap.set(path, folderIndex);
      }
    }

    // Upload files to their respective folders with auto-indexing
    let successCount = 0;
    let failCount = 0;

    for (const [dirPath, dirFiles] of filesByPath) {
      const folderId = dirPath ? folderIdMap.get(dirPath) : baseParentId;
      const folderIndex = dirPath ? folderIndexMap.get(dirPath) : baseParentIndex;

      // Get or initialize used indices for this folder
      const folderKey = dirPath || "";
      if (!usedIndicesByParent.has(folderKey)) {
        usedIndicesByParent.set(folderKey, []);
      }
      const usedIndices = usedIndicesByParent.get(folderKey)!;

      for (const file of dirFiles) {
        // Calculate next index for this file
        const fileIndex = getNextIndex(usedIndices, folderIndex);
        usedIndices.push(fileIndex);

        const success = await uploadFile(file, folderId || null, dataRoomId, fileIndex);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    if (failCount > 0) {
      toast.warning(`${successCount} file caricati, ${failCount} falliti`);
    } else {
      toast.success(`${successCount} file caricati con successo`);
    }
  };

  // Handle file upload
  const handleUpload = async (files: FileList | null, isFolder: boolean = false) => {
    if (!files || files.length === 0) return;

    if (!selectedItem) {
      toast.error("Seleziona prima una Data Room o cartella");
      return;
    }

    setUploading(true);

    try {
      if (isFolder) {
        await processFolderUpload(files);
      } else {
        // Simple file upload
        const dataRoomId = selectedItem.type === "dataroom"
          ? selectedItem.id
          : selectedItem.dataRoomId;

        if (!dataRoomId) {
          throw new Error("Data Room non trovata");
        }

        const folderId = selectedItem.type === "folder" ? selectedItem.id : null;

        let successCount = 0;
        // Start with the next available index and increment for each file
        let currentIndex = getNextAvailableIndex();
        const usedIndices = [...existingIndices];
        
        for (const file of Array.from(files)) {
          // Pass auto-generated index for each file
          const success = await uploadFile(file, folderId, dataRoomId, currentIndex);
          if (success) {
            successCount++;
            // Add used index to track and get next
            usedIndices.push(currentIndex);
            currentIndex = getNextIndex(usedIndices, selectedItem?.index);
          }
        }

        toast.success(`${successCount} file caricati con successo`);
      }

      fetchData();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  // Handle external drag & drop
  const handleExternalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(false);

    if (!selectedItem) {
      toast.error("Seleziona prima una Data Room o cartella");
      return;
    }

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Process dropped items
    const processEntry = async (entry: FileSystemEntry, path: string = ""): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            // Add path info to file
            Object.defineProperty(file, "webkitRelativePath", {
              value: path ? `${path}/${file.name}` : file.name,
            });
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();

        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            const newPath = path ? `${path}/${entry.name}` : entry.name;
            for (const subEntry of entries) {
              await processEntry(subEntry, newPath);
            }
            resolve();
          });
        });
      }
    };

    // Check if items contain directories
    const hasDirectories = Array.from(items).some(
      (item) => item.webkitGetAsEntry()?.isDirectory
    );

    if (items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      setUploading(true);
      try {
        for (const item of Array.from(items)) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await processEntry(entry);
          }
        }

        // Convert to FileList-like object for upload
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));

        await handleUpload(dt.files, hasDirectories);
      } catch (err) {
        console.error("Drop error:", err);
        toast.error("Errore durante il drop");
      } finally {
        setUploading(false);
      }
    } else {
      // Fallback for browsers without webkitGetAsEntry
      await handleUpload(e.dataTransfer.files, false);
    }
  };

  // Handle internal drag & drop (move items)
  const handleInternalDrop = async (targetItem: FileItem, draggedItemId: string) => {
    if (targetItem.type === "file") return;

    // Find the dragged item
    const findItem = (items: FileItem[], id: string): FileItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const draggedItemData = findItem(dataRooms, draggedItemId);
    if (!draggedItemData) return;

    // Determine target folder and data room
    const targetDataRoomId = targetItem.type === "dataroom" ? targetItem.id : targetItem.dataRoomId;
    const targetFolderId = targetItem.type === "folder" ? targetItem.id : null;

    if (!targetDataRoomId) return;

    try {
      // Fetch existing items in target location to calculate new index
      let targetContents: FileItem[] = [];
      
      // Fetch folders in target
      const foldersUrl = targetFolderId
        ? `/api/folders?dataRoomId=${targetDataRoomId}&parentId=${targetFolderId}`
        : `/api/folders?dataRoomId=${targetDataRoomId}`;
      const { data: foldersData } = await authFetch<{ success: boolean; data: { id: string; index: string | null }[] }>(foldersUrl);
      if (foldersData?.data) {
        targetContents = targetContents.concat(
          foldersData.data.map((f) => ({ id: f.id, name: "", type: "folder" as const, index: f.index }))
        );
      }
      
      // Fetch documents in target
      const docsUrl = targetFolderId
        ? `/api/datarooms/${targetDataRoomId}/documents?folderId=${targetFolderId}`
        : `/api/datarooms/${targetDataRoomId}/documents`;
      const { data: docsData } = await authFetch<{ success: boolean; data: { id: string; index: string | null }[] }>(docsUrl);
      if (docsData?.data) {
        targetContents = targetContents.concat(
          docsData.data.map((d) => ({ id: d.id, name: "", type: "file" as const, index: d.index }))
        );
      }
      
      // Calculate next available index in target
      const targetIndices = targetContents
        .filter((item) => item.id !== draggedItemId) // Exclude the item being moved
        .map((item) => item.index);
      const newIndex = getNextIndex(targetIndices, targetItem.type === "folder" ? targetItem.index : null);

      if (draggedItemData.type === "file") {
        // Move document with new index
        const { error } = await authFetch(`/api/documents/${draggedItemId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId: targetFolderId,
            dataRoomId: targetDataRoomId,
            index: newIndex,
          }),
        });

        if (error) throw new Error(error);
        toast.success("File spostato con successo");
      } else if (draggedItemData.type === "folder") {
        // Move folder with new index
        const { error } = await authFetch(`/api/folders/${draggedItemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: targetFolderId,
            dataRoomId: targetDataRoomId,
            index: newIndex,
          }),
        });

        if (error) throw new Error(error);
        toast.success("Cartella spostata con successo");
      }

      fetchData();
    } catch (err) {
      console.error("Move error:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante lo spostamento");
    }
  };

  // Create folder handler
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    if (!selectedItem) {
      toast.error("Seleziona prima una Data Room o cartella");
      return;
    }

    try {
      const dataRoomId = selectedItem.type === "dataroom"
        ? selectedItem.id
        : selectedItem.dataRoomId;

      if (!dataRoomId) {
        throw new Error("Data Room non trovata");
      }

      const parentId = selectedItem.type === "folder" ? selectedItem.id : null;
      // Auto-assign index if not provided
      const indexToUse = newFolderIndex.trim() || getNextAvailableIndex();

      const result = await createFolder(newFolderName.trim(), parentId, dataRoomId, indexToUse);

      if (!result) {
        throw new Error("Errore nella creazione della cartella");
      }

      toast.success("Cartella creata con successo");
      setCreateFolderOpen(false);
      setNewFolderName("");
      setNewFolderIndex("");
      fetchData();
    } catch (err) {
      console.error("Create folder error:", err);
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    }
  };

  // Selection handlers
  const handleSelectItem = (item: FileItem, selected: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = sortedContents
        .filter((item) => item.type !== "dataroom")
        .map((item) => item.id);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Download handlers
  const handleDownloadSingle = async (item: FileItem) => {
    if (item.type === "file") {
      // Direct download for single file
      try {
        const response = await fetch(`/api/documents/${item.id}/download`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("File scaricato con successo");
      } catch (err) {
        console.error("Download error:", err);
        toast.error("Errore durante il download");
      }
    } else if (item.type === "folder") {
      // Download folder as ZIP
      setDownloadArchiveName(item.name);
      setDownloadDialogOpen(true);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedItems.size === 0) {
      toast.error("Seleziona almeno un elemento");
      return;
    }
    setDownloadArchiveName("download");
    setDownloadDialogOpen(true);
  };

  const handleDownloadArchive = async () => {
    setIsDownloading(true);

    try {
      const documentIds: string[] = [];
      const folderIds: string[] = [];

      // Collect IDs from selection or from single folder
      if (selectedItems.size > 0) {
        const findItem = (items: FileItem[], id: string): FileItem | null => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItem(item.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        for (const id of selectedItems) {
          const item = findItem(dataRooms, id);
          if (item?.type === "file") {
            documentIds.push(id);
          } else if (item?.type === "folder") {
            folderIds.push(id);
          }
        }
      } else {
        // Single folder download (from context menu)
        const findItem = (items: FileItem[], name: string): FileItem | null => {
          for (const item of items) {
            if (item.name === name) return item;
            if (item.children) {
              const found = findItem(item.children, name);
              if (found) return found;
            }
          }
          return null;
        };

        const item = findItem(dataRooms, downloadArchiveName);
        if (item?.type === "folder") {
          folderIds.push(item.id);
        }
      }

      const response = await fetch("/api/documents/download-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds,
          folderIds,
          password: downloadPassword || undefined,
          archiveName: downloadArchiveName || "download",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${downloadArchiveName || "download"}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Archivio scaricato con successo");
      setDownloadDialogOpen(false);
      setDownloadPassword("");
      setDownloadArchiveName("");
      clearSelection();
    } catch (err) {
      console.error("Archive download error:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante il download");
    } finally {
      setIsDownloading(false);
    }
  };

  // Version history handlers
  const handleVersionHistory = (item: FileItem) => {
    setVersioningItem(item);
    setVersionHistoryOpen(true);
  };

  const handleUploadVersion = (item: FileItem) => {
    setVersioningItem(item);
    setUploadVersionOpen(true);
  };

  // Delete handlers
  const handleDeleteClick = (item: FileItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) {
      toast.error("Seleziona almeno un elemento");
      return;
    }
    setItemToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const documentIds: string[] = [];
      const folderIds: string[] = [];

      if (itemToDelete) {
        // Single item delete
        if (itemToDelete.type === "file") {
          documentIds.push(itemToDelete.id);
        } else if (itemToDelete.type === "folder") {
          folderIds.push(itemToDelete.id);
        }
      } else {
        // Bulk delete
        const findItem = (items: FileItem[], id: string): FileItem | null => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItem(item.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        for (const id of selectedItems) {
          const item = findItem(dataRooms, id);
          if (item?.type === "file") {
            documentIds.push(id);
          } else if (item?.type === "folder") {
            folderIds.push(id);
          }
        }
      }

      const response = await fetch("/api/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds, folderIds }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Eliminazione fallita");
      }

      toast.success(result.message || "Elementi eliminati con successo");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      clearSelection();
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    } finally {
      setIsDeleting(false);
    }
  };

  // Rename handlers
  const handleRenameClick = (item: FileItem) => {
    setItemToRename(item);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!itemToRename) return;

    try {
      const endpoint = itemToRename.type === "file"
        ? `/api/documents/${itemToRename.id}`
        : `/api/folders/${itemToRename.id}`;

      const { error } = await authFetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (error) throw new Error(error);

      toast.success("Rinominato con successo");
      setRenameDialogOpen(false);
      setItemToRename(null);
      fetchData();
    } catch (err) {
      console.error("Rename error:", err);
      toast.error(err instanceof Error ? err.message : "Errore durante la rinomina");
    }
  };

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!selectedItem) return [];

    const findPath = (
      items: FileItem[],
      targetId: string,
      path: FileItem[] = []
    ): FileItem[] | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return [...path, item];
        }
        if (item.children) {
          const found = findPath(item.children, targetId, [...path, item]);
          if (found) return found;
        }
      }
      return null;
    };

    return findPath(dataRooms, selectedItem.id) || [];
  }, [selectedItem, dataRooms]);

  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    { label: "File Explorer" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Caricamento Virtual Data Rooms...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="File Explorer"
          description="Browse and manage your documents"
          breadcrumbs={breadcrumbs}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => fetchData()}
            >
              Riprova
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files, false)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error - webkitdirectory is not in types but works in browsers
        webkitdirectory=""
        className="hidden"
        onChange={(e) => handleUpload(e.target.files, true)}
      />

      {/* Page Header */}
      <PageHeader
        title="File Explorer"
        description="Browse and manage your Virtual Data Rooms"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" disabled={uploading || !selectedItem}>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
                  <Folder className="mr-2 h-4 w-4" />
                  Upload Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={() => setCreateFolderOpen(true)}
              disabled={!selectedItem}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div
        ref={dropZoneRef}
        className={cn(
          "flex gap-4 h-[calc(100vh-220px)] relative",
          isExternalDragOver && "after:absolute after:inset-0 after:bg-primary/10 after:border-2 after:border-dashed after:border-primary after:rounded-lg after:pointer-events-none"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!draggedItem) {
            setIsExternalDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          // Check if we're actually leaving the drop zone, not just moving to a child element
          const rect = dropZoneRef.current?.getBoundingClientRect();
          if (rect) {
            const { clientX, clientY } = e;
            if (
              clientX < rect.left ||
              clientX > rect.right ||
              clientY < rect.top ||
              clientY > rect.bottom
            ) {
              setIsExternalDragOver(false);
            }
          }
        }}
        onDrop={handleExternalDrop}
      >
        {/* External drop overlay */}
        {isExternalDragOver && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg z-50"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Only hide if leaving to outside the window
              if (!e.relatedTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setIsExternalDragOver(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExternalDrop(e);
            }}
          >
            <div className="flex flex-col items-center gap-2 text-primary pointer-events-none">
              <Upload className="h-12 w-12" />
              <p className="text-lg font-medium">Rilascia file o cartelle qui</p>
              <p className="text-sm text-muted-foreground">
                {selectedItem ? `Upload in "${selectedItem.name}"` : "Seleziona prima una destinazione"}
              </p>
            </div>
          </div>
        )}

        {/* Left Panel - Navigation Tree */}
        <Card
          className="w-64 shrink-0 border-border/60 h-full overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            if (!draggedItem) setIsExternalDragOver(true);
          }}
          onDrop={handleExternalDrop}
        >
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-3 border-b border-border/60 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Virtual Data Rooms</h3>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-2">
                {dataRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessuna Data Room</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.location.href = "/datarooms/create"}
                    >
                      Crea Data Room
                    </Button>
                  </div>
                ) : (
                  dataRooms.map((item) => (
                    <NavTreeItem
                      key={item.id}
                      item={item}
                      selectedId={selectedItem?.id || null}
                      onSelect={handleNavigate}
                      expandedIds={navExpandedIds}
                      onToggleExpand={toggleNavExpand}
                      onDrop={handleInternalDrop}
                      draggedItem={draggedItem}
                      setDraggedItem={setDraggedItem}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - Content Table */}
        <Card
          className="flex-1 border-border/60 overflow-hidden h-full"
          onDragOver={(e) => {
            e.preventDefault();
            if (!draggedItem) setIsExternalDragOver(true);
          }}
          onDrop={handleExternalDrop}
        >
          <CardContent className="p-0 h-full flex flex-col">
            {/* Toolbar */}
            <div className="p-3 border-b border-border/60 space-y-2">
              {/* Path */}
              <div className="flex items-center gap-1 text-sm">
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSelectedItem(null)}
                >
                  Root
                </button>
                {breadcrumbPath.map((item, index) => (
                  <span key={item.id} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <button
                      className={cn(
                        "transition-colors",
                        index === breadcrumbPath.length - 1
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleNavigate(item)}
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Search and Selection Actions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Selection Actions */}
                {selectedItems.size > 0 && (
                  <div className="flex items-center gap-2 pl-2 border-l">
                    <span className="text-sm text-muted-foreground">
                      {selectedItems.size} selezionati
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSelected}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Scarica ZIP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Annulla selezione
                    </Button>
                  </div>
                )}

                {/* Manage Indexing Button */}
                {canEditIndex && selectedItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManageIndexingOpen(true)}
                    className="ml-auto"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Gestisci Indici
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedItems.size > 0 && selectedItems.size === sortedContents.filter(i => i.type !== "dataroom").length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <IndexColumnHeader
                        sortDirection={indexSortDirection}
                        onSort={handleIndexSort}
                      />
                    </TableHead>
                    <TableHead
                      className="w-[30%] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      Nome
                      {sortColumn === "name" && indexSortDirection === null && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead>Labels</TableHead>
                    <TableHead
                      className="w-[150px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("date")}
                    >
                      Data
                      {sortColumn === "date" && indexSortDirection === null && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      className="w-[100px] cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("size")}
                    >
                      Dimensione
                      {sortColumn === "size" && indexSortDirection === null && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Folder className="h-8 w-8" />
                          <p>
                            {searchQuery
                              ? "Nessun risultato trovato"
                              : dataRooms.length === 0
                                ? "Nessuna Data Room presente"
                                : selectedItem
                                  ? "Questa cartella è vuota"
                                  : "Seleziona una Data Room"}
                          </p>
                          {!searchQuery && selectedItem && (
                            <p className="text-sm">
                              Trascina file o cartelle qui oppure usa il pulsante Upload
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedContents.map((item) => (
                      <ContentTreeRow
                        key={item.id}
                        item={item}
                        expandedIds={contentExpandedIds}
                        onToggleExpand={toggleContentExpand}
                        onNavigate={handleNavigate}
                        onDrop={handleInternalDrop}
                        draggedItem={draggedItem}
                        setDraggedItem={setDraggedItem}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={handleSelectItem}
                        onDownload={handleDownloadSingle}
                        onDelete={handleDeleteClick}
                        onVersionHistory={handleVersionHistory}
                        onUploadVersion={handleUploadVersion}
                        onViewDocument={(item) => {
                          setViewerDocument(item);
                          setViewerOpen(true);
                        }}
                        onRename={handleRenameClick}
                        canEditIndex={canEditIndex}
                        onIndexChange={handleIndexChange}
                        searchQuery={searchQuery}
                        existingIndices={existingIndices}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea nuova cartella</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `La cartella verrà creata in "${selectedItem.name}"`
                : "Seleziona una Data Room o cartella dal pannello di sinistra"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Nome cartella</Label>
              <Input
                id="folderName"
                placeholder="Es. Documenti Finanziari"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim() && selectedItem) {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderIndex">Indice (opzionale)</Label>
              <Input
                id="folderIndex"
                placeholder={getNextAvailableIndex()}
                value={newFolderIndex}
                onChange={(e) => setNewFolderIndex(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Formato: numeri separati da punti (es. 1.2.3). Suggerito: {getNextAvailableIndex()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || !selectedItem}
            >
              Crea cartella
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              {itemToDelete ? (
                <>
                  Sei sicuro di voler eliminare{" "}
                  <strong>{itemToDelete.name}</strong>
                  {itemToDelete.type === "folder" && (
                    <> e tutto il suo contenuto</>
                  )}
                  ?
                </>
              ) : (
                <>
                  Sei sicuro di voler eliminare{" "}
                  <strong>{selectedItems.size} elementi</strong> selezionati?
                </>
              )}
              <br />
              <span className="text-destructive">Questa azione non può essere annullata.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Elimina
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Archive Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Archive className="inline-block mr-2 h-5 w-5" />
              Download come archivio ZIP
            </DialogTitle>
            <DialogDescription>
              {selectedItems.size > 0 ? (
                <>Scarica {selectedItems.size} elementi selezionati come archivio ZIP.</>
              ) : (
                <>Scarica la cartella e il suo contenuto come archivio ZIP.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archiveName">Nome archivio</Label>
              <Input
                id="archiveName"
                placeholder="Es. documenti-progetto"
                value={downloadArchiveName}
                onChange={(e) => setDownloadArchiveName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="archivePassword">
                <Lock className="inline-block mr-1 h-4 w-4" />
                Password (opzionale)
              </Label>
              <Input
                id="archivePassword"
                type="password"
                placeholder="Inserisci una password per proteggere l'archivio"
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se inserisci una password, l&apos;archivio sarà protetto e richiederà la password per essere aperto.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDownloadDialogOpen(false);
                setDownloadPassword("");
                setDownloadArchiveName("");
              }}
              disabled={isDownloading}
            >
              Annulla
            </Button>
            <Button onClick={handleDownloadArchive} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creazione archivio...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica ZIP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      {versioningItem && (
        <VersionHistoryDialog
          documentId={versioningItem.id}
          currentVersion={1}
          open={versionHistoryOpen}
          onOpenChange={(open) => {
            setVersionHistoryOpen(open);
            if (!open) setVersioningItem(null);
          }}
          onVersionRestored={() => {
            fetchData();
          }}
        />
      )}

      {/* Upload Version Dialog */}
      {versioningItem && (
        <UploadVersionDialog
          documentId={versioningItem.id}
          documentName={versioningItem.name}
          open={uploadVersionOpen}
          onOpenChange={(open) => {
            setUploadVersionOpen(open);
            if (!open) setVersioningItem(null);
          }}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* Rename Dialog */}
      {itemToRename && (
        <RenameDialog
          open={renameDialogOpen}
          onOpenChange={(open) => {
            setRenameDialogOpen(open);
            if (!open) setItemToRename(null);
          }}
          initialName={itemToRename.name}
          onSubmit={handleRenameSubmit}
        />
      )}

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={viewerDocument ? {
          id: viewerDocument.id,
          name: viewerDocument.name,
          fileType: viewerDocument.fileType || "application/octet-stream",
          size: viewerDocument.size,
        } : null}
        allowDownload={true}
      />

      {/* Manage Indexing Dialog */}
      <ManageIndexingDialog
        open={manageIndexingOpen}
        onOpenChange={setManageIndexingOpen}
        items={currentContents.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          index: item.index,
        }))}
        parentIndex={selectedItem?.index}
        onSave={handleBulkIndexUpdate}
      />
    </div>
  );
}
