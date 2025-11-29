"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface DataRoomContextValue {
    /** ID del dataroom corrente (null se nessuno selezionato) */
    currentDataRoomId: string | null;
    /** Nome del dataroom corrente */
    currentDataRoomName: string | null;
    /** Imposta il dataroom corrente */
    setCurrentDataRoom: (id: string | null, name?: string | null) => void;
    /** Pulisce il dataroom corrente */
    clearCurrentDataRoom: () => void;
}

const DataRoomContext = createContext<DataRoomContextValue | undefined>(undefined);

interface DataRoomProviderProps {
    children: ReactNode;
}

export function DataRoomProvider({ children }: DataRoomProviderProps) {
    const [currentDataRoomId, setCurrentDataRoomId] = useState<string | null>(null);
    const [currentDataRoomName, setCurrentDataRoomName] = useState<string | null>(null);

    const setCurrentDataRoom = useCallback((id: string | null, name?: string | null) => {
        setCurrentDataRoomId(id);
        setCurrentDataRoomName(name ?? null);
    }, []);

    const clearCurrentDataRoom = useCallback(() => {
        setCurrentDataRoomId(null);
        setCurrentDataRoomName(null);
    }, []);

    return (
        <DataRoomContext.Provider
            value={{
                currentDataRoomId,
                currentDataRoomName,
                setCurrentDataRoom,
                clearCurrentDataRoom,
            }}
        >
            {children}
        </DataRoomContext.Provider>
    );
}

/**
 * Hook per accedere al context del DataRoom corrente
 */
export function useDataRoomContext() {
    const context = useContext(DataRoomContext);
    if (context === undefined) {
        throw new Error("useDataRoomContext deve essere usato dentro un DataRoomProvider");
    }
    return context;
}

/**
 * Hook per ottenere solo l'ID del dataroom corrente (safe, non lancia errore)
 */
export function useCurrentDataRoomId(): string | null {
    const context = useContext(DataRoomContext);
    return context?.currentDataRoomId ?? null;
}
