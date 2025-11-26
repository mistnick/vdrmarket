"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Upload,
  Download,
  RotateCcw,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";

interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  uploadedBy: {
    name: string | null;
    email: string;
  };
  uploadedAt: string;
  isCurrent: boolean;
  changeNotes?: string;
}

export default function DocumentVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/versions`);

      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Errore nel caricamento delle versioni");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNewVersion = async (file: File) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      toast.success("Nuova versione caricata con successo");
      await fetchVersions();
    } catch (error) {
      console.error("Error uploading version:", error);
      toast.error("Errore nel caricamento della nuova versione");
    } finally {
      setUploading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("Sei sicuro di voler ripristinare questa versione?")) {
      return;
    }

    setRestoring(versionId);

    try {
      const response = await fetch(
        `/api/documents/${documentId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to restore version");
      }

      toast.success("Versione ripristinata con successo");
      await fetchVersions();
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Errore nel ripristino della versione");
    } finally {
      setRestoring(null);
    }
  };

  const handleDownloadVersion = async (versionId: string, fileName: string) => {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/versions/${versionId}/download`
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download avviato");
    } catch (error) {
      console.error("Error downloading version:", error);
      toast.error("Errore nel download della versione");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento versioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Versioni Documento</h1>
            <p className="text-muted-foreground">
              Gestisci le versioni e ripristina versioni precedenti
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Indietro
            </Button>
            <Button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleUploadNewVersion(file);
                };
                input.click();
              }}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Caricamento..." : "Carica Nuova Versione"}
            </Button>
          </div>
        </div>

        {versions.length === 0 && (
          <Card className="p-8">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nessuna versione disponibile
              </h3>
              <p className="text-muted-foreground mb-4">
                Carica una nuova versione per iniziare il versioning
              </p>
            </div>
          </Card>
        )}

        {versions.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versione</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Caricato da</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">v{version.version}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{version.fileName}</p>
                        {version.changeNotes && (
                          <p className="text-sm text-muted-foreground">
                            {version.changeNotes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {version.uploadedBy.name || "Utente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {version.uploadedBy.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(version.uploadedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {version.isCurrent ? (
                        <Badge>Corrente</Badge>
                      ) : (
                        <Badge variant="outline">Storico</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownloadVersion(version.id, version.fileName)
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={restoring === version.id}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Informazioni sul Versioning
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Ogni upload crea una nuova versione del documento</li>
              <li>• Le versioni precedenti vengono conservate automaticamente</li>
              <li>• Puoi ripristinare qualsiasi versione precedente</li>
              <li>• Il ripristino crea una nuova versione con il contenuto precedente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
