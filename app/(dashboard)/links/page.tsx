"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Eye, Loader2, Plus, Search, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LinkActions } from "@/components/links/link-actions";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { PermissionGuard } from "@/components/shared/permission-guard";

interface LinkData {
  id: string;
  name: string | null;
  slug: string;
  document: {
    name: string;
  };
  _count: {
    views: number;
  };
  expiresAt: string | null;
  createdAt: string;
}

function LinksContent() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/links", {
        credentials: "include"
      });
      if (response.ok) {
        const result = await response.json();
        setLinks(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const totalViews = links.reduce((acc, link) => acc + link._count.views, 0);
  const activeLinks = links.filter(
    (link) => !link.expiresAt || new Date(link.expiresAt) > new Date()
  ).length;

  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    { label: "Shared Links" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Shared Links"
        description="Manage and track your shared document links"
        breadcrumbs={breadcrumbs}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Link
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Links" value={links.length.toString()} icon={Link2} />
        <StatCard title="Total Views" value={totalViews.toString()} icon={Eye} />
        <StatCard title="Active Links" value={activeLinks.toString()} icon={Link2} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-card p-1 rounded-lg border border-border/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-9 border-none shadow-none focus-visible:ring-0 h-9"
          />
        </div>
        <div className="flex items-center gap-1 pr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Links Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <CardContent className="p-12">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        ) : links.length === 0 ? (
          <CardContent className="p-12">
            <EmptyState
              icon={Link2}
              title="No links yet"
              description="Create your first shared link to track document views"
              action={{
                label: "Create Link",
                onClick: () => setDialogOpen(true),
              }}
            />
          </CardContent>
        ) : (
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-[30%]">Link Name</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const isExpired =
                    link.expiresAt && new Date(link.expiresAt) < new Date();
                  const isActive = !isExpired;

                  return (
                    <TableRow key={link.id} className="group hover:bg-muted/30 border-border/60">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-primary/10 text-primary">
                            <Link2 className="h-4 w-4" />
                          </div>
                          <span className="text-foreground font-medium">{link.name || "Untitled Link"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{link.document.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-muted-foreground/70" />
                          <span>{link._count.views}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
                          }
                        >
                          {isActive ? "Active" : "Expired"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(link.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <LinkActions slug={link.slug} linkName={link.name || ""} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <CreateLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchLinks}
      />
    </div>
  );
}

export default function LinksPage() {
  return (
    <PermissionGuard
      requiredPermission={(p) => p.canViewLinks}
      fallbackMessage="Non hai i permessi per visualizzare i link. Contatta l'amministratore."
    >
      <LinksContent />
    </PermissionGuard>
  );
}
