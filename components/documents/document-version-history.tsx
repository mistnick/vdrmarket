"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Clock,
  Download,
  RotateCcw,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface DocumentVersion {
  id?: string;
  versionNumber: number;
  file: string;
  fileSize: number;
  createdAt: string;
  isCurrent: boolean;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  documentName: string;
  currentVersion: number;
}

export function DocumentVersionHistory({
  documentId,
  documentName,
  currentVersion,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions([data.currentVersion, ...data.history]);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNewVersion = async (file: File) => {
    try {
      setUploadingNew(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchVersions();
        setShowUploadDialog(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to upload new version");
      }
    } catch (error) {
      console.error("Error uploading new version:", error);
      alert("An error occurred while uploading");
    } finally {
      setUploadingNew(false);
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Restore version ${versionNumber}? This will create a new version with the restored content.`)) {
      return;
    }

    try {
      setRestoringVersion(versionId);
      const response = await fetch(
        `/api/documents/${documentId}/versions/${versionId}/restore`,
        { method: "POST" }
      );

      if (response.ok) {
        await fetchVersions();
        alert("Version restored successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to restore version");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("An error occurred while restoring");
    } finally {
      setRestoringVersion(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              View and manage document versions
            </CardDescription>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Version</DialogTitle>
                <DialogDescription>
                  Upload a new version of {documentName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The file must be the same type as the original document.
                    The current version will be saved to history.
                  </AlertDescription>
                </Alert>
                <div className="mt-4">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadNewVersion(file);
                      }
                    }}
                    disabled={uploadingNew}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                {uploadingNew && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No version history available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id || version.versionNumber}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  version.isCurrent ? "bg-primary/5 border-primary/20" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {version.isCurrent ? (
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    ) : (
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        Version {version.versionNumber}
                      </span>
                      {version.isCurrent && (
                        <Badge className="bg-primary text-primary-foreground">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Created: {format(new Date(version.createdAt), "MMM dd, yyyy HH:mm")}
                      </div>
                      <div>Size: {formatFileSize(version.fileSize)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!version.isCurrent && version.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreVersion(version.id!, version.versionNumber)}
                      disabled={restoringVersion === version.id}
                    >
                      {restoringVersion === version.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Restore
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
