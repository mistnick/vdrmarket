import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { FileText, Upload, FolderPlus, Eye, Link2, Search, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocumentActions } from "@/components/documents/document-actions";
import { CreateFolderButton } from "@/components/folders/create-folder-button";

export default async function DocumentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    include: {
      teams: {
        include: {
          team: {
            include: {
              documents: {
                include: {
                  folder: true,
                  dataRoom: true,
                  _count: {
                    select: {
                      links: true,
                      views: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      },
    },
  });

  const allDocuments = user?.teams.flatMap((tm) => tm.team.documents) || [];
  const userTeams = user?.teams.map(tm => ({ id: tm.team.id, name: tm.team.name })) || [];

  // Calculate stats
  const totalDocuments = allDocuments.length;
  const totalLinks = allDocuments.reduce((sum, doc) => sum + doc._count.links, 0);
  const totalViews = allDocuments.reduce((sum, doc) => sum + doc._count.views, 0);
  const totalStorage = allDocuments.reduce((sum, doc) => sum + doc.fileSize, 0) / (1024 * 1024);

  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    { label: "Documents" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Documents"
        description="Manage and share your documents securely"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <CreateFolderButton teams={userTeams} />
            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/documents/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={totalDocuments.toString()}
          icon={FileText}
        />
        <StatCard
          title="Total Links"
          value={totalLinks.toString()}
          icon={Link2}
        />
        <StatCard
          title="Total Views"
          value={totalViews.toString()}
          icon={Eye}
        />
        <StatCard
          title="Storage Used"
          value={`${totalStorage.toFixed(1)} MB`}
          icon={FolderPlus}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-card p-1 rounded-lg border border-border/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9 border-none shadow-none focus-visible:ring-0 h-9"
          />
        </div>
        <div className="flex items-center gap-1 pr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        {allDocuments.length === 0 ? (
          <CardContent className="p-12">
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your first document to get started"
              action={{
                label: "Upload Document",
                href: "/documents/upload",
              }}
            />
          </CardContent>
        ) : (
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDocuments.map((doc) => (
                  <TableRow key={doc.id} className="group cursor-pointer hover:bg-muted/30 border-border/60">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-foreground font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs rounded-sm px-1.5 py-0 h-5">
                        {doc.fileType.split('/')[1] || 'file'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc._count.links}</TableCell>
                    <TableCell className="text-muted-foreground">{doc._count.views}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DocumentActions
                          documentId={doc.id}
                          documentName={doc.name}
                          file={doc.file}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
