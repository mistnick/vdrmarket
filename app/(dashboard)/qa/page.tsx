"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { QAViewer } from "@/components/qa/qa-viewer";
import { QACategoryManager } from "@/components/qa/qa-category-manager";
import { Loader2 } from "lucide-react";
import { PermissionGuard } from "@/components/shared/permission-guard";

function QAContent() {
    const router = useRouter();
    const [dataRoomId, setDataRoomId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDefaultDataRoom() {
            try {
                const response = await fetch("/api/datarooms");
                if (!response.ok) {
                    setLoading(false);
                    return;
                }

                const result = await response.json();
                const dataRooms = result.data || [];

                if (dataRooms.length > 0) {
                    setDataRoomId(dataRooms[0].id);
                }
            } catch (error) {
                console.error("Error fetching data rooms:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDefaultDataRoom();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!dataRoomId) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Q&A Management"
                    description="Manage questions and answers for your data room"
                />
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 border rounded-lg bg-muted/10">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold">No Data Rooms Available</h2>
                        <p className="text-muted-foreground">
                            You need a Data Room to manage Q&A.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/datarooms")}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Create Data Room
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Q&A Management"
                description="Manage questions and answers for your data room"
            />

            <Tabs defaultValue="questions" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="questions">
                    <QAViewer dataRoomId={dataRoomId} />
                </TabsContent>

                <TabsContent value="categories">
                    <QACategoryManager dataRoomId={dataRoomId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function QAPage() {
    return (
        <PermissionGuard
            requiredPermission={(p) => p.isAdministrator || p.canManageQA}
            fallbackMessage="Non hai i permessi per gestire le domande e risposte. Questa funzionalità è riservata agli amministratori."
        >
            <QAContent />
        </PermissionGuard>
    );
}
