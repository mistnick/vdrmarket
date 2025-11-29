/**
 * React hook for checking user permissions in the UI
 * Based on GroupType: ADMINISTRATOR, USER, CUSTOM
 */

import { useCallback } from "react";
import useSWR from "swr";
import { useCurrentDataRoomId } from "@/components/providers/dataroom-provider";

export type GroupType = "ADMINISTRATOR" | "USER" | "CUSTOM";

export interface UserPermissions {
    // Core permissions
    isAdministrator: boolean;
    groupType: GroupType | null;
    
    // DataRoom permissions
    canViewDataRoom: boolean;
    canEditDataRoom: boolean;
    canDeleteDataRoom: boolean;
    canManageMembers: boolean;
    
    // Document permissions
    canViewDocuments: boolean;
    canCreateDocuments: boolean;
    canEditDocuments: boolean;
    canDeleteDocuments: boolean;
    canDownloadDocuments: boolean;
    
    // Folder permissions
    canViewFolders: boolean;
    canCreateFolders: boolean;
    canEditFolders: boolean;
    canDeleteFolders: boolean;
    
    // Link permissions
    canViewLinks: boolean;
    canCreateLinks: boolean;
    canEditLinks: boolean;
    canDeleteLinks: boolean;
    
    // Settings & Admin
    canViewSettings: boolean;
    canEditSettings: boolean;
    canViewAudit: boolean;
    canManageGroups: boolean;
    canManageUsers: boolean;
    canManageQA: boolean;
    canAccessRecycleBin: boolean;
    
    // Custom group flags
    canViewDueDiligenceChecklist: boolean;
    canManageDocumentPermissions: boolean;
    canViewGroupUsers: boolean;
    canViewGroupActivity: boolean;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
    isAdministrator: false,
    groupType: null,
    canViewDataRoom: false,
    canEditDataRoom: false,
    canDeleteDataRoom: false,
    canManageMembers: false,
    canViewDocuments: false,
    canCreateDocuments: false,
    canEditDocuments: false,
    canDeleteDocuments: false,
    canDownloadDocuments: false,
    canViewFolders: false,
    canCreateFolders: false,
    canEditFolders: false,
    canDeleteFolders: false,
    canViewLinks: false,
    canCreateLinks: false,
    canEditLinks: false,
    canDeleteLinks: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewAudit: false,
    canManageGroups: false,
    canManageUsers: false,
    canManageQA: false,
    canAccessRecycleBin: false,
    canViewDueDiligenceChecklist: false,
    canManageDocumentPermissions: false,
    canViewGroupUsers: false,
    canViewGroupActivity: false,
};

export const ADMINISTRATOR_PERMISSIONS: UserPermissions = {
    isAdministrator: true,
    groupType: "ADMINISTRATOR",
    canViewDataRoom: true,
    canEditDataRoom: true,
    canDeleteDataRoom: true,
    canManageMembers: true,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canDeleteDocuments: true,
    canDownloadDocuments: true,
    canViewFolders: true,
    canCreateFolders: true,
    canEditFolders: true,
    canDeleteFolders: true,
    canViewLinks: true,
    canCreateLinks: true,
    canEditLinks: true,
    canDeleteLinks: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewAudit: true,
    canManageGroups: true,
    canManageUsers: true,
    canManageQA: true,
    canAccessRecycleBin: true,
    canViewDueDiligenceChecklist: true,
    canManageDocumentPermissions: true,
    canViewGroupUsers: true,
    canViewGroupActivity: true,
};

export const USER_PERMISSIONS: UserPermissions = {
    ...DEFAULT_PERMISSIONS,
    groupType: "USER",
    canViewDataRoom: true,
    canViewDocuments: true,
    canDownloadDocuments: true,
    canViewFolders: true,
    canViewLinks: true,
};

interface GroupMembership {
    groupId: string;
    groupType: GroupType;
    groupName: string;
    canViewDueDiligenceChecklist: boolean;
    canManageDocumentPermissions: boolean;
    canViewGroupUsers: boolean;
    canManageUsers: boolean;
    canViewGroupActivity: boolean;
}

interface PermissionsResponse {
    memberships: GroupMembership[];
}

interface DataRoom {
    id: string;
    name: string;
}

interface DataRoomsResponse {
    data: DataRoom[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Hook per ottenere il primo dataroom disponibile dell'utente
 */
export function useFirstDataRoom() {
    const { data, error, isLoading } = useSWR<DataRoomsResponse>(
        "/api/datarooms",
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    return {
        dataRoom: data?.data?.[0] ?? null,
        isLoading,
        error,
    };
}

/**
 * Hook to get user permissions for a specific data room
 */
export function usePermissions(dataRoomId: string | null | undefined) {
    const { data, error, isLoading } = useSWR<PermissionsResponse>(
        dataRoomId ? `/api/datarooms/${dataRoomId}/my-permissions` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    const permissions = useCallback((): UserPermissions => {
        if (!data?.memberships || data.memberships.length === 0) {
            return DEFAULT_PERMISSIONS;
        }

        // Check if user is in ADMINISTRATOR group
        const adminMembership = data.memberships.find(
            (m) => m.groupType === "ADMINISTRATOR"
        );
        if (adminMembership) {
            return ADMINISTRATOR_PERMISSIONS;
        }

        // Check if user is in CUSTOM group with extended permissions
        const customMembership = data.memberships.find(
            (m) => m.groupType === "CUSTOM"
        );
        if (customMembership) {
            return {
                ...USER_PERMISSIONS,
                groupType: "CUSTOM",
                canViewDueDiligenceChecklist: customMembership.canViewDueDiligenceChecklist,
                canManageDocumentPermissions: customMembership.canManageDocumentPermissions,
                canViewGroupUsers: customMembership.canViewGroupUsers,
                canManageUsers: customMembership.canManageUsers,
                canViewGroupActivity: customMembership.canViewGroupActivity,
                // Extended permissions based on flags
                canEditDocuments: customMembership.canManageDocumentPermissions,
                canViewAudit: customMembership.canViewGroupActivity,
            };
        }

        // Default to USER permissions
        return USER_PERMISSIONS;
    }, [data]);

    return {
        permissions: permissions(),
        isLoading,
        error,
        memberships: data?.memberships || [],
    };
}

/**
 * Hook per i permessi usando il dataroom dal context
 */
export function useCurrentPermissions() {
    const dataRoomId = useCurrentDataRoomId();
    const { dataRoom: firstDataRoom } = useFirstDataRoom();
    
    // Usa il dataroom dal context, o il primo disponibile come fallback
    const effectiveDataRoomId = dataRoomId ?? firstDataRoom?.id ?? null;
    
    return usePermissions(effectiveDataRoomId);
}

/**
 * Hook to check a single permission
 */
export function useHasPermission(
    dataRoomId: string | null | undefined,
    permission: keyof UserPermissions
): boolean {
    const { permissions } = usePermissions(dataRoomId);
    return permissions[permission] as boolean;
}

/**
 * Hook to check if user is administrator
 */
export function useIsAdministrator(dataRoomId: string | null | undefined): boolean {
    const { permissions } = usePermissions(dataRoomId);
    return permissions.isAdministrator;
}

/**
 * Hook per verificare se l'utente è amministratore del dataroom corrente
 */
export function useIsCurrentAdministrator(): boolean {
    const { permissions } = useCurrentPermissions();
    return permissions.isAdministrator;
}
