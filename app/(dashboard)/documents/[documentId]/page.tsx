"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentVersionHistory } from "@/components/documents/document-version-history";
import { DocumentPreview } from "@/components/documents/document-preview";
import {
  FileText,
  Download,
  Share2,
  Eye,
  Link2,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  name: string;
  description: string | null;
  file: string;
  fileType: string;
  fileSize: number;
  versions: number;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  folder: {
    id: string;
    name: string;
  } | null;
  _count?: {
    links: number;
    views: number;
  };
}

interface ViewStats {
  totalViews: number;
  uniqueViewers: number;
  avgDuration: number;
  avgCompletion: number;
  recentViews: Array<{
    id: string;
    viewerEmail: string | null;
    viewerName: string | null;
    viewedAt: string;
    duration: number | null;
    completionRate: number | null;
  }>;
}

export default function DocumentDetailPage({
  params,
}: {
  params: { documentId: string };
}) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDocument();
    fetchViewStats();
  }, [params.documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${params.documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      } else if (response.status === 404) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewStats = async () => {
    try {
      const response = await fetch(
        `/api/analytics/document/${params.documentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setViewStats(data);
      }
    } catch (error) {
      console.error("Error fetching view stats:", error);
    }
  };

  const handleCreateLink = async () => {
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: params.documentId,
          name: `Share ${document?.name}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(`${window.location.origin}/view/${data.slug}`);
        setShowShareDialog(true);
      }
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${params.documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Document not found
        </h2>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {document.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
              <span>
                Uploaded {format(new Date(document.createdAt), "MMM dd, yyyy")}
              </span>
              <span>•</span>
              <span>{formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span>v{document.versions}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Views</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {viewStats?.totalViews || 0}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Unique Viewers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {viewStats?.uniqueViewers || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Duration</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {viewStats?.avgDuration
                    ? `${Math.round(viewStats.avgDuration / 60)}m`
                    : "0m"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Links</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {document._count?.links || 0}
                </p>
              </div>
              <Link2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="links">Sharing Links</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Using a sample PDF for demo if no real file */}
              <DocumentPreview
                url={document.file.startsWith("http") ? document.file : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                fileType={document.fileType || "pdf"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-slate-600">Description</Label>
                <p className="text-slate-900 mt-1">
                  {document.description || "No description provided"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-600">Owner</Label>
                  <p className="text-slate-900 mt-1">
                    {document.owner.name || document.owner.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Team</Label>
                  <p className="text-slate-900 mt-1">{document.team.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">File Type</Label>
                  <p className="text-slate-900 mt-1">{document.fileType}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Folder</Label>
                  <p className="text-slate-900 mt-1">
                    {document.folder?.name || "Root"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <DocumentVersionHistory
            documentId={document.id}
            documentName={document.name}
            currentVersion={document.versions}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Views</CardTitle>
              <CardDescription>
                Latest document views and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewStats?.recentViews && viewStats.recentViews.length > 0 ? (
                <div className="space-y-3">
                  {viewStats.recentViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {view.viewerName || view.viewerEmail || "Anonymous"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(view.viewedAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      <div className="text-right">
                        {view.duration && (
                          <p className="text-sm text-slate-600">
                            {Math.round(view.duration / 60)}m duration
                          </p>
                        )}
                        {view.completionRate && (
                          <p className="text-sm text-green-600">
                            {Math.round(view.completionRate)}% completed
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No views yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Sharing Links</CardTitle>
              <CardDescription>
                Manage who can access this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Create New Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Anyone with this link can view the document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Share Link</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={handleCopyLink} size="sm">
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
