"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [teamId, setTeamId] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [globalUploading, setGlobalUploading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teamId) {
      fetchFolders();
    }
  }, [teamId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
        // Auto-select first team if available
        if (data.data.length > 0) {
          setTeamId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/folders?teamId=${teamId}`);
      const data = await response.json();
      if (data.success) {
        setFolders(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: "pending" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: "pending" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadSingleFile = async (fileObj: UploadFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      const formData = new FormData();
      formData.append("file", fileObj.file);
      formData.append("name", fileObj.file.name);
      formData.append("teamId", teamId);
      if (folderId) {
        formData.append("folderId", folderId);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "success", progress: 100 } : f
        )
      );
      return true;
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, status: "error", error: error.message, progress: 0 }
            : f
        )
      );
      return false;
    }
  };

  const handleUploadAll = async () => {
    if (!teamId) {
      toast.error("Please select a team");
      return;
    }

    setGlobalUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");

    let successCount = 0;
    for (const file of pendingFiles) {
      const success = await uploadSingleFile(file);
      if (success) successCount++;
    }

    setGlobalUploading(false);

    if (successCount === pendingFiles.length) {
      toast.success(`Successfully uploaded ${successCount} files`);
      setTimeout(() => {
        router.push("/documents");
        router.refresh();
      }, 1500);
    } else if (successCount > 0) {
      toast.warning(`Uploaded ${successCount} files, but some failed`);
    } else {
      toast.error("Failed to upload files");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload new documents to your data room
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            Choose files and destination folder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select value={teamId} onValueChange={setTeamId} disabled={globalUploading}>
              <SelectTrigger id="team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="folder">Folder (Optional)</Label>
            <Select
              value={folderId || "none"}
              onValueChange={(val) => setFolderId(val === "none" ? null : val)}
              disabled={globalUploading}
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload with Drag & Drop */}
          <div className="space-y-2">
            <Label>Files</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive
                ? "border-primary bg-primary/5"
                : "hover:border-primary"
                } ${globalUploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                disabled={globalUploading}
              />
              <label htmlFor="file" className="cursor-pointer block">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel, PowerPoint, or Text files
                </p>
              </label>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Selected Files ({files.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {files.map((fileObj) => (
                  <div key={fileObj.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{fileObj.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileObj.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {fileObj.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                        {fileObj.status === "pending" && !globalUploading && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFile(fileObj.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(fileObj.status === "uploading" || fileObj.status === "success") && (
                      <Progress value={fileObj.progress} className="h-1" />
                    )}

                    {/* Error Message */}
                    {fileObj.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">{fileObj.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleUploadAll}
              disabled={globalUploading || files.length === 0 || !teamId}
              className="flex-1"
            >
              {globalUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length > 0 ? `${files.length} Files` : "Files"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={globalUploading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
