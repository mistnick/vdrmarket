/**
 * VDR Document & Folder Permissions Service
 * Handles permission resolution for documents and folders
 * Combines group and user-level permissions
 */

import { prisma } from "@/lib/db/prisma";
import { canManageDocumentPermissions, canViewAllDocuments, isAdministrator } from "./authorization";

export interface DocumentPermissions {
    canFence: boolean;
    canView: boolean;
    canDownloadEncrypted: boolean;
    canDownloadPdf: boolean;
    canDownloadOriginal: boolean;
    canUpload: boolean;
    canManage: boolean;
}

export interface FolderPermissions extends DocumentPermissions { }

/**
 * Get effective document permissions for a user
 * Combines group permissions (OR logic) with user-specific overrides
 */
export async function getDocumentPermissions(
    userId: string,
    documentId: string
): Promise<DocumentPermissions> {
    // Get the document to find its data room
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { dataRoomId: true },
    });

    if (!document || !document.dataRoomId) {
        return getNoPermissions();
    }

    // Administrators have all permissions
    if (await canViewAllDocuments(userId, document.dataRoomId)) {
        return getAllPermissions();
    }

    // Get user's groups in this data room
    const groups = await prisma.group.findMany({
        where: {
            dataRoomId: document.dataRoomId,
            members: {
                some: { userId },
            },
        },
        include: {
            documentPermissions: {
                where: { documentId },
            },
        },
    });

    // Start with no permissions
    const permissions: DocumentPermissions = getNoPermissions();

    // Aggregate group permissions with OR logic
    for (const group of groups) {
        for (const perm of group.documentPermissions) {
            permissions.canFence = permissions.canFence || perm.canFence;
            permissions.canView = permissions.canView || perm.canView;
            permissions.canDownloadEncrypted =
                permissions.canDownloadEncrypted || perm.canDownloadEncrypted;
            permissions.canDownloadPdf =
                permissions.canDownloadPdf || perm.canDownloadPdf;
            permissions.canDownloadOriginal =
                permissions.canDownloadOriginal || perm.canDownloadOriginal;
            permissions.canUpload = permissions.canUpload || perm.canUpload;
            permissions.canManage = permissions.canManage || perm.canManage;
        }
    }

    // Apply user-specific permission overrides
    const userPermission = await prisma.documentUserPermission.findUnique({
        where: {
            documentId_userId: {
                documentId,
                userId,
            },
        },
    });

    if (userPermission) {
        permissions.canFence = userPermission.canFence;
        permissions.canView = userPermission.canView;
        permissions.canDownloadEncrypted = userPermission.canDownloadEncrypted;
        permissions.canDownloadPdf = userPermission.canDownloadPdf;
        permissions.canDownloadOriginal = userPermission.canDownloadOriginal;
        permissions.canUpload = userPermission.canUpload;
        permissions.canManage = userPermission.canManage;
    }

    // Filter canManage based on user's role permissions
    // USER type cannot manage documents even if permission is set
    if (permissions.canManage && document.dataRoomId) {
        const hasManagePermission = await canManageDocumentPermissions(
            userId,
            document.dataRoomId
        );
        if (!hasManagePermission) {
            permissions.canManage = false;
        }
    }

    return permissions;
}

/**
 * Check if user can view a specific document
 */
export async function canViewDocument(
    userId: string,
    documentId: string
): Promise<boolean> {
    const permissions = await getDocumentPermissions(userId, documentId);
    return permissions.canView || permissions.canFence;
}

/**
 * Check if user can download a document
 */
export async function canDownloadDocument(
    userId: string,
    documentId: string,
    format: "encrypted" | "pdf" | "original" = "original"
): Promise<boolean> {
    const permissions = await getDocumentPermissions(userId, documentId);

    switch (format) {
        case "encrypted":
            return permissions.canDownloadEncrypted;
        case "pdf":
            return permissions.canDownloadPdf;
        case "original":
            return permissions.canDownloadOriginal;
        default:
            return false;
    }
}

/**
 * Check if user can manage a document (copy, move, rename, delete, redact, label)
 */
export async function canManageDocument(
    userId: string,
    documentId: string
): Promise<boolean> {
    const permissions = await getDocumentPermissions(userId, documentId);
    return permissions.canManage;
}

/**
 * Set document permissions for a group
 */
export async function setDocumentGroupPermissions(
    documentId: string,
    groupId: string,
    permissions: Partial<DocumentPermissions>
): Promise<void> {
    await prisma.documentGroupPermission.upsert({
        where: {
            documentId_groupId: {
                documentId,
                groupId,
            },
        },
        update: {
            ...permissions,
            updatedAt: new Date(),
        },
        create: {
            documentId,
            groupId,
            ...getNoPermissions(),
            ...permissions,
        },
    });
}

/**
 * Set document permissions for a specific user (override)
 */
export async function setDocumentUserPermissions(
    documentId: string,
    userId: string,
    permissions: Partial<DocumentPermissions>
): Promise<void> {
    await prisma.documentUserPermission.upsert({
        where: {
            documentId_userId: {
                documentId,
                userId,
            },
        },
        update: {
            ...permissions,
            updatedAt: new Date(),
        },
        create: {
            documentId,
            userId,
            ...getNoPermissions(),
            ...permissions,
        },
    });
}

/**
 * Remove document permissions for a group
 */
export async function removeDocumentGroupPermissions(
    documentId: string,
    groupId: string
): Promise<void> {
    await prisma.documentGroupPermission.deleteMany({
        where: {
            documentId,
            groupId,
        },
    });
}

/**
 * Remove user-specific document permissions
 */
export async function removeDocumentUserPermissions(
    documentId: string,
    userId: string
): Promise<void> {
    await prisma.documentUserPermission.deleteMany({
        where: {
            documentId,
            userId,
        },
    });
}

// ============================================
// Folder Permissions (similar logic to documents)
// ============================================

/**
 * Get effective folder permissions for a user
 */
export async function getFolderPermissions(
    userId: string,
    folderId: string
): Promise<FolderPermissions> {
    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { dataRoomId: true },
    });

    if (!folder || !folder.dataRoomId) {
        return getNoPermissions();
    }

    // Administrators have all permissions
    if (await isAdministrator(userId, folder.dataRoomId)) {
        return getAllPermissions();
    }

    const groups = await prisma.group.findMany({
        where: {
            dataRoomId: folder.dataRoomId,
            members: {
                some: { userId },
            },
        },
        include: {
            folderPermissions: {
                where: { folderId },
            },
        },
    });

    const permissions: FolderPermissions = getNoPermissions();

    // Aggregate group permissions
    for (const group of groups) {
        for (const perm of group.folderPermissions) {
            permissions.canFence = permissions.canFence || perm.canFence;
            permissions.canView = permissions.canView || perm.canView;
            permissions.canDownloadEncrypted =
                permissions.canDownloadEncrypted || perm.canDownloadEncrypted;
            permissions.canDownloadPdf =
                permissions.canDownloadPdf || perm.canDownloadPdf;
            permissions.canDownloadOriginal =
                permissions.canDownloadOriginal || perm.canDownloadOriginal;
            permissions.canUpload = permissions.canUpload || perm.canUpload;
            permissions.canManage = permissions.canManage || perm.canManage;
        }
    }

    // Apply user-specific overrides
    const userPermission = await prisma.folderUserPermission.findUnique({
        where: {
            folderId_userId: {
                folderId,
                userId,
            },
        },
    });

    if (userPermission) {
        permissions.canFence = userPermission.canFence;
        permissions.canView = userPermission.canView;
        permissions.canDownloadEncrypted = userPermission.canDownloadEncrypted;
        permissions.canDownloadPdf = userPermission.canDownloadPdf;
        permissions.canDownloadOriginal = userPermission.canDownloadOriginal;
        permissions.canUpload = userPermission.canUpload;
        permissions.canManage = userPermission.canManage;
    }

    // Filter canManage based on role
    if (permissions.canManage && folder.dataRoomId) {
        const hasManagePermission = await canManageDocumentPermissions(
            userId,
            folder.dataRoomId
        );
        if (!hasManagePermission) {
            permissions.canManage = false;
        }
    }

    return permissions;
}

/**
 * Set folder permissions for a group
 */
export async function setFolderGroupPermissions(
    folderId: string,
    groupId: string,
    permissions: Partial<FolderPermissions>
): Promise<void> {
    await prisma.folderGroupPermission.upsert({
        where: {
            folderId_groupId: {
                folderId,
                groupId,
            },
        },
        update: {
            ...permissions,
            updatedAt: new Date(),
        },
        create: {
            folderId,
            groupId,
            ...getNoPermissions(),
            ...permissions,
        },
    });
}

/**
 * Set folder permissions for a specific user
 */
export async function setFolderUserPermissions(
    folderId: string,
    userId: string,
    permissions: Partial<FolderPermissions>
): Promise<void> {
    await prisma.folderUserPermission.upsert({
        where: {
            folderId_userId: {
                folderId,
                userId,
            },
        },
        update: {
            ...permissions,
            updatedAt: new Date(),
        },
        create: {
            folderId,
            userId,
            ...getNoPermissions(),
            ...permissions,
        },
    });
}

// Helper functions

function getAllPermissions(): DocumentPermissions {
    return {
        canFence: true,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: true,
        canUpload: true,
        canManage: true,
    };
}

function getNoPermissions(): DocumentPermissions {
    return {
        canFence: false,
        canView: false,
        canDownloadEncrypted: false,
        canDownloadPdf: false,
        canDownloadOriginal: false,
        canUpload: false,
        canManage: false,
    };
}
