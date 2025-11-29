"use client";

import { ReactNode } from "react";
import { useCurrentPermissions, type UserPermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldX, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PermissionGuardProps {
    /** Figli da renderizzare se l'utente ha i permessi */
    children: ReactNode;
    /** Funzione per verificare se l'utente ha i permessi necessari */
    requiredPermission: (permissions: UserPermissions) => boolean;
    /** Messaggio da mostrare se l'utente non ha i permessi */
    fallbackMessage?: string;
    /** Se true, mostra un loader durante il caricamento dei permessi */
    showLoader?: boolean;
    /** Se true, reindirizza alla dashboard invece di mostrare un messaggio */
    redirectOnDenied?: boolean;
}

/**
 * Componente per proteggere sezioni dell'UI basandosi sui permessi utente.
 * Usa il context del DataRoom corrente per determinare i permessi.
 */
export function PermissionGuard({
    children,
    requiredPermission,
    fallbackMessage = "Non hai i permessi necessari per accedere a questa sezione.",
    showLoader = true,
    redirectOnDenied = false,
}: PermissionGuardProps) {
    const router = useRouter();
    const { permissions, isLoading } = useCurrentPermissions();

    // Durante il caricamento mostra un loader
    if (isLoading && showLoader) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifica permessi...</p>
                </div>
            </div>
        );
    }

    // Verifica i permessi
    const hasPermission = requiredPermission(permissions);

    if (!hasPermission) {
        if (redirectOnDenied) {
            router.replace("/dashboard");
            return null;
        }

        return (
            <div className="space-y-6 p-6">
                <Alert variant="destructive" className="max-w-lg mx-auto">
                    <ShieldX className="h-4 w-4" />
                    <AlertTitle>Accesso negato</AlertTitle>
                    <AlertDescription className="mt-2">
                        {fallbackMessage}
                    </AlertDescription>
                </Alert>
                <div className="text-center">
                    <Button onClick={() => router.push("/dashboard")}>
                        Torna alla Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * HOC per proteggere un'intera pagina con verifica permessi
 */
export function withPermissionGuard<P extends object>(
    Component: React.ComponentType<P>,
    requiredPermission: (permissions: UserPermissions) => boolean,
    fallbackMessage?: string
) {
    return function ProtectedComponent(props: P) {
        return (
            <PermissionGuard
                requiredPermission={requiredPermission}
                fallbackMessage={fallbackMessage}
            >
                <Component {...props} />
            </PermissionGuard>
        );
    };
}
