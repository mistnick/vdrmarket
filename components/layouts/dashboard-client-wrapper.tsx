"use client";

import { I18nProvider } from "@/lib/i18n-context";
import { DataRoomProvider } from "@/components/providers/dataroom-provider";

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <DataRoomProvider>
                {children}
            </DataRoomProvider>
        </I18nProvider>
    );
}
