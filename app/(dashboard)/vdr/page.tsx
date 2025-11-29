"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * VDR Root Page - Redirects to the first available data room's VDR
 * This is a convenience route so users can access /vdr directly
 */
export default function VDRRootPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function redirectToFirstDataRoom() {
            try {
                // Fetch user's data rooms
                const response = await fetch("/api/datarooms");
                if (!response.ok) {
                    console.error("Failed to fetch data rooms");
                    setLoading(false);
                    return;
                }

                const result = await response.json();
                const dataRooms = result.data || [];

                if (dataRooms.length > 0) {
                    // Redirect to first data room's VDR
                    router.push(`/data-rooms/${dataRooms[0].id}/vdr`);
                } else {
                    // No data rooms, stop loading and show empty state
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching data rooms:", error);
                setError("Failed to load data rooms");
                setLoading(false);
            }
        }

        redirectToFirstDataRoom();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading Virtual Data Room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-destructive mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-primary hover:underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">No Data Rooms Found</h2>
                <p className="text-muted-foreground">
                    You need to create a Data Room before accessing the VDR.
                </p>
            </div>
            <button
                onClick={() => router.push("/datarooms")}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
                Go to Data Rooms
            </button>
        </div>
    );
}
