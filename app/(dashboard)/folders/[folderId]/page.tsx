"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Folder,
  FileText,
  Upload,
  FolderPlus,
  Edit,
  Trash2,
  Download,
  Share2,
  MoreVertical,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface FolderData {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  parent: {
    id: string;
    name: string;
  } | null;
  _count: {
    documents: number;
    children: number;
  };
}

interface FolderItem {
  id: string;
  name: string;
  type: "folder" | "document";
  size?: number;
  createdAt: string;
  owner?: {
    name: string | null;
    email: string;
  };
}

export default function FolderDetailPage({
  params,
}: {
  params: { folderId: string };
}) {
  const router = useRouter();
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFolder();
    fetchItems();
  }, [params.folderId]);

  const fetchFolder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/folders/${params.folderId}`);
      if (response.ok) {
        const data = await response.json();
        setFolder(data);
      } else if (response.status === 404) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/folders/${params.folderId}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: params.folderId,
        }),
      });

      if (response.ok) {
        setNewFolderName("");
        setShowNewFolderDialog(false);
        fetchItems();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will delete all contents.")) return;

    try {
      const response = await fetch(`/api/folders/${params.folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getBreadcrumbs = () => {
    if (!folder) return [];
    const parts = folder.path.split("/").filter(Boolean);
    return parts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="text-center py-12">
        <Folder className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Folder not found
        </h2>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/dashboard" className="hover:text-slate-900">
          Dashboard
        </Link>
        {getBreadcrumbs().map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{part}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Folder className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{folder.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
              <span>
                {folder._count.documents} documents, {folder._count.children}{" "}
                folders
              </span>
              <span>•</span>
              <span>
                Created {format(new Date(folder.createdAt), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog
            open={showNewFolderDialog}
            onOpenChange={setShowNewFolderDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder inside {folder.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateFolder}
                  disabled={creating || !newFolderName.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Folder"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Documents</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {folder._count.documents}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Subfolders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {folder._count.children}
                </p>
              </div>
              <Folder className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Owner</p>
                <p className="text-base font-semibold text-slate-900 mt-1">
                  {folder.owner.name || folder.owner.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contents</CardTitle>
          <CardDescription>
            Files and folders in this directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>This folder is empty</p>
              <p className="text-sm mt-1">
                Upload files or create subfolders to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.type === "folder" ? (
                          <Folder className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-600" />
                        )}
                        <Link
                          href={
                            item.type === "folder"
                              ? `/folders/${item.id}`
                              : `/documents/${item.id}`
                          }
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.owner?.name || item.owner?.email || "-"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.size ? formatFileSize(item.size) : "-"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
