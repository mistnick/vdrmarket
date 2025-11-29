/**
 * Unit tests for VDR Document Permissions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "@/lib/test/prisma-mock";
import {
    getDocumentPermissions,
    getFolderPermissions,
    canViewDocument,
    canDownloadDocument,
    canManageDocument,
} from "@/lib/vdr/document-permissions";

vi.mock("@/lib/db/prisma", () => ({
    prisma: prismaMock,
}));

describe("VDR Document Permissions", () => {
    const userId = "user-123";
    const documentId = "doc-456";
    const folderId = "folder-789";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getDocumentPermissions", () => {
        it("should aggregate group permissions with OR logic", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
                { groupId: "group-2" },
            ] as any);

            prismaMock.documentGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canDownloadPdf: true,
                    canFence: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canUpload: false,
                    canManage: false,
                },
                {
                    groupId: "group-2",
                    canView: true,
                    canDownloadOriginal: true,
                    canFence: false,
                    canDownloadPdf: false,
                    canDownloadEncrypted: false,
                    canUpload: false,
                    canManage: false,
                },
            ] as any);

            prismaMock.documentUserPermission.findUnique.mockResolvedValue(null);

            const permissions = await getDocumentPermissions(userId, documentId);

            // Should have canView from both groups
            expect(permissions.canView).toBe(true);
            // Should have canDownloadPdf from group-1
            expect(permissions.canDownloadPdf).toBe(true);
            // Should have canDownloadOriginal from group-2
            expect(permissions.canDownloadOriginal).toBe(true);
            // Should not have permissions neither group has
            expect(permissions.canManage).toBe(false);
        });

        it("should return user-specific permissions when they exist (override)", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.documentGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canDownloadPdf: true,
                    canFence: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canUpload: false,
                    canManage: false,
                },
            ] as any);

            // User override with different permissions
            prismaMock.documentUserPermission.findUnique.mockResolvedValue({
                userId,
                documentId,
                canView: true,
                canDownloadOriginal: true,
                canManage: true,
                canFence: false,
                canDownloadPdf: false, // Override: no PDF
                canDownloadEncrypted: false,
                canUpload: false,
            } as any);

            const permissions = await getDocumentPermissions(userId, documentId);

            // Should use user override completely
            expect(permissions.canView).toBe(true);
            expect(permissions.canDownloadPdf).toBe(false); // Overridden
            expect(permissions.canDownloadOriginal).toBe(true); // From override
            expect(permissions.canManage).toBe(true); // From override
        });

        it("should return no permissions if user has no groups and no overrides", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([]);
            prismaMock.documentGroupPermission.findMany.mockResolvedValue([]);
            prismaMock.documentUserPermission.findUnique.mockResolvedValue(null);

            const permissions = await getDocumentPermissions(userId, documentId);

            expect(permissions.canView).toBe(false);
            expect(permissions.canDownloadPdf).toBe(false);
            expect(permissions.canDownloadOriginal).toBe(false);
            expect(permissions.canManage).toBe(false);
        });
    });

    describe("getFolderPermissions", () => {
        it("should work similarly to document permissions", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.folderGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canUpload: true,
                    canFence: false,
                    canDownloadPdf: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canManage: false,
                },
            ] as any);

            prismaMock.folderUserPermission.findUnique.mockResolvedValue(null);

            const permissions = await getFolderPermissions(userId, folderId);

            expect(permissions.canView).toBe(true);
            expect(permissions.canUpload).toBe(true);
            expect(permissions.canManage).toBe(false);
        });

        it("should apply user overrides for folders", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.folderGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canUpload: false,
                    canFence: false,
                    canDownloadPdf: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canManage: false,
                },
            ] as any);

            prismaMock.folderUserPermission.findUnique.mockResolvedValue({
                userId,
                folderId,
                canView: true,
                canUpload: true, // Override
                canManage: true, // Override
                canFence: false,
                canDownloadPdf: false,
                canDownloadEncrypted: false,
                canDownloadOriginal: false,
            } as any);

            const permissions = await getFolderPermissions(userId, folderId);

            expect(permissions.canView).toBe(true);
            expect(permissions.canUpload).toBe(true); // Overridden
            expect(permissions.canManage).toBe(true); // Overridden
        });
    });

    describe("Permission Helper Functions", () => {
        it("canViewDocument should return true if user can view", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.documentGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canFence: false,
                    canDownloadPdf: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canUpload: false,
                    canManage: false,
                },
            ] as any);

            prismaMock.documentUserPermission.findUnique.mockResolvedValue(null);

            const canView = await canViewDocument(userId, documentId);
            expect(canView).toBe(true);
        });

        it("canDownloadDocument should check download permissions", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.documentGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canDownloadPdf: true,
                    canFence: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canUpload: false,
                    canManage: false,
                },
            ] as any);

            prismaMock.documentUserPermission.findUnique.mockResolvedValue(null);

            const canDownload = await canDownloadDocument(userId, documentId, "pdf");
            expect(canDownload).toBe(true);

            const canDownloadOriginal = await canDownloadDocument(userId, documentId, "original");
            expect(canDownloadOriginal).toBe(false);
        });

        it("canManageDocument should check manage permission", async () => {
            prismaMock.groupMember.findMany.mockResolvedValue([
                { groupId: "group-1" },
            ] as any);

            prismaMock.documentGroupPermission.findMany.mockResolvedValue([
                {
                    groupId: "group-1",
                    canView: true,
                    canManage: true,
                    canFence: false,
                    canDownloadPdf: false,
                    canDownloadEncrypted: false,
                    canDownloadOriginal: false,
                    canUpload: false,
                },
            ] as any);

            prismaMock.documentUserPermission.findUnique.mockResolvedValue(null);

            const canManage = await canManageDocument(userId, documentId);
            expect(canManage).toBe(true);
        });
    });
});
