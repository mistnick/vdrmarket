"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Shield, FileText, Loader2, MoreVertical, Settings, Users, Lock, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateDataRoomDialog } from "@/components/datarooms/create-dataroom-dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface DataRoom {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: {
    folders: number;
    documents: number;
  };
}

export default function DataRoomsPage() {
  const router = useRouter();
  const { authFetch } = useAuthFetch();
  const [dataRooms, setDataRooms] = useState<DataRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDataRooms() {
      setLoading(true);
      const { data, error } = await authFetch<{ data: DataRoom[] }>("/api/datarooms");
      
      if (data?.data) {
        setDataRooms(data.data);
      } else if (error) {
        console.error("Error fetching data rooms:", error);
        toast.error("Failed to fetch data rooms");
      }
      setLoading(false);
    }

    fetchDataRooms();
  }, [authFetch]);

  const refreshDataRooms = useCallback(async () => {
    const { data, error } = await authFetch<{ data: DataRoom[] }>("/api/datarooms");
    if (data?.data) {
      setDataRooms(data.data);
    } else if (error) {
      console.error("Error refreshing data rooms:", error);
    }
  }, [authFetch]);

  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    { label: "Data Rooms" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Data Rooms"
        description="Organize documents in secure virtual data rooms"
        breadcrumbs={breadcrumbs}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Shield className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Create Data Room
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-card p-1 rounded-lg border border-border/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data rooms..."
            className="pl-9 border-none shadow-none focus-visible:ring-0 h-9"
          />
        </div>
        <div className="flex items-center gap-1 pr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      )}

      {/* Empty State */}
      {!loading && dataRooms.length === 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={Shield}
              title="No data rooms yet"
              description="Create your first data room to organize and share documents securely"
              action={{
                label: "Create Data Room",
                onClick: () => setDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Data Rooms Grid */}
      {!loading && dataRooms.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dataRooms.map((dataRoom) => (
            <Card
              key={dataRoom.id}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => router.push(`/datarooms/${dataRoom.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/datarooms/${dataRoom.id}`);
                        }}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Manage Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg truncate">{dataRoom.name}</h3>
                  {!dataRoom.isPublic && (
                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  )}
                </div>

                <Badge
                  variant={dataRoom.isPublic ? "default" : "secondary"}
                  className="mb-3"
                >
                  {dataRoom.isPublic ? "Public" : "Private"}
                </Badge>

                {dataRoom.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {dataRoom.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" strokeWidth={1.5} />
                    <span>{dataRoom._count.folders} folders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" strokeWidth={1.5} />
                    <span>{dataRoom._count.documents} docs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Data Room Dialog */}
      <CreateDataRoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refreshDataRooms}
      />
    </div>
  );
}
