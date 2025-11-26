"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FolderNode {
    id: string;
    name: string;
    parentId: string | null;
    path: string;
    children?: FolderNode[];
    _count?: {
        documents: number;
    };
}

interface FolderTreeProps {
    folders: FolderNode[];
    currentFolderId?: string;
    className?: string;
}

interface TreeNodeProps {
    folder: FolderNode;
    level: number;
    currentFolderId?: string;
    onToggle?: (folderId: string) => void;
    expandedFolders: Set<string>;
}

function TreeNode({ folder, level, currentFolderId, onToggle, expandedFolders }: TreeNodeProps) {
    const pathname = usePathname();
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isCurrent = folder.id === currentFolderId;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle?.(folder.id);
    };

    return (
        <div>
            <Link
                href={`/dashboard/folders/${folder.id}`}
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isCurrent && "bg-accent text-accent-foreground font-medium"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {hasChildren && (
                    <button
                        onClick={handleToggle}
                        className="p-0.5 hover:bg-accent-foreground/10 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}

                {!hasChildren && <div className="w-5" />}

                {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                    <Folder className="h-4 w-4 text-slate-500" />
                )}

                <span className="flex-1 truncate">{folder.name}</span>

                {folder._count && folder._count.documents > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {folder._count.documents}
                    </span>
                )}
            </Link>

            {hasChildren && isExpanded && (
                <div className="mt-0.5">
                    {folder.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            currentFolderId={currentFolderId}
                            onToggle={onToggle}
                            expandedFolders={expandedFolders}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree({ folders, currentFolderId, className }: FolderTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(currentFolderId ? [currentFolderId] : [])
    );

    const handleToggle = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Build folder hierarchy
    const buildTree = (folders: FolderNode[]): FolderNode[] => {
        const folderMap = new Map<string, FolderNode>();
        const rootFolders: FolderNode[] = [];

        // Create map of all folders
        folders.forEach((folder) => {
            folderMap.set(folder.id, { ...folder, children: [] });
        });

        // Build tree structure
        folders.forEach((folder) => {
            const node = folderMap.get(folder.id)!;
            if (folder.parentId && folderMap.has(folder.parentId)) {
                const parent = folderMap.get(folder.parentId)!;
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            } else {
                rootFolders.push(node);
            }
        });

        return rootFolders;
    };

    const tree = buildTree(folders);

    if (tree.length === 0) {
        return (
            <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
                No folders yet
            </div>
        );
    }

    return (
        <div className={cn("space-y-0.5", className)}>
            {tree.map((folder) => (
                <TreeNode
                    key={folder.id}
                    folder={folder}
                    level={0}
                    currentFolderId={currentFolderId}
                    onToggle={handleToggle}
                    expandedFolders={expandedFolders}
                />
            ))}
        </div>
    );
}
