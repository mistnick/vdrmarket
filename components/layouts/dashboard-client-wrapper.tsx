"use client";

import { I18nProvider } from "@/lib/i18n-context";
import { DataRoomProvider } from "@/components/providers/dataroom-provider";
import { TenantProvider } from "@/hooks/use-tenant";

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <TenantProvider>
                <DataRoomProvider>
                    {children}
                </DataRoomProvider>
            </TenantProvider>
        </I18nProvider>
    );
}
