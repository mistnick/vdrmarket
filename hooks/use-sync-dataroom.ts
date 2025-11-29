"use client";

import { useEffect } from "react";
import { useDataRoomContext } from "@/components/providers/dataroom-provider";

/**
 * Hook per sincronizzare il DataRoom context con il dataroom corrente della pagina.
 * Da usare nelle pagine che lavorano con un dataroom specifico.
 * 
 * @param dataRoomId - ID del dataroom da impostare nel context
 * @param dataRoomName - Nome opzionale del dataroom
 */
export function useSyncDataRoom(dataRoomId: string | null | undefined, dataRoomName?: string | null) {
    const { setCurrentDataRoom, clearCurrentDataRoom } = useDataRoomContext();

    useEffect(() => {
        if (dataRoomId) {
            setCurrentDataRoom(dataRoomId, dataRoomName ?? null);
        }

        // Non pulire quando il componente viene smontato,
        // così il dataroom rimane selezionato nella navigazione
    }, [dataRoomId, dataRoomName, setCurrentDataRoom]);
}

/**
 * Hook per pulire il DataRoom context quando si esce da una sezione dataroom.
 * Da usare nelle pagine che non sono associate a un dataroom specifico.
 */
export function useClearDataRoom() {
    const { clearCurrentDataRoom } = useDataRoomContext();

    useEffect(() => {
        clearCurrentDataRoom();
    }, [clearCurrentDataRoom]);
}
