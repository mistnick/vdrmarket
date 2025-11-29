import { PrismaClient, GroupType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/dataroom?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

/**
 * Default permission presets for different group types
 * These define what each group type can do by default on documents and folders
 */
export const GROUP_PERMISSION_PRESETS = {
    // Administrator groups have full access
    [GroupType.ADMINISTRATOR]: {
        canFence: true,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: true,
        canUpload: true,
        canManage: true,
    },
    // Standard user groups have view and limited download
    [GroupType.USER]: {
        canFence: false,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: false,
        canUpload: false,
        canManage: false,
    },
    // Custom groups start with minimal permissions
    [GroupType.CUSTOM]: {
        canFence: false,
        canView: true,
        canDownloadEncrypted: false,
        canDownloadPdf: false,
        canDownloadOriginal: false,
        canUpload: false,
        canManage: false,
    },
};

/**
 * Permission presets by role (within a group)
 * These can be used to override group-level permissions for specific members
 */
export const ROLE_PERMISSION_PRESETS = {
    owner: {
        canFence: true,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: true,
        canUpload: true,
        canManage: true,
    },
    admin: {
        canFence: true,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: true,
        canUpload: true,
        canManage: true,
    },
    member: {
        canFence: false,
        canView: true,
        canDownloadEncrypted: true,
        canDownloadPdf: true,
        canDownloadOriginal: false,
        canUpload: true,
        canManage: false,
    },
    viewer: {
        canFence: false,
        canView: true,
        canDownloadEncrypted: false,
        canDownloadPdf: false,
        canDownloadOriginal: false,
        canUpload: false,
        canManage: false,
    },
};

type PermissionSet = {
    canFence: boolean;
    canView: boolean;
    canDownloadEncrypted: boolean;
    canDownloadPdf: boolean;
    canDownloadOriginal: boolean;
    canUpload: boolean;
    canManage: boolean;
};

/**
 * Apply default permissions to all documents for a group based on group type
 */
async function applyGroupPermissionsToAllDocuments(
    groupId: string,
    dataRoomId: string,
    permissions: PermissionSet
) {
    // Get all documents in the data room
    const documents = await prisma.document.findMany({
        where: { dataRoomId },
        select: { id: true },
    });

    console.log(`  Applying permissions to ${documents.length} documents...`);

    for (const document of documents) {
        await prisma.documentGroupPermission.upsert({
            where: {
                documentId_groupId: {
                    documentId: document.id,
                    groupId,
                },
            },
            create: {
                documentId: document.id,
                groupId,
                ...permissions,
            },
            update: permissions,
        });
    }
}

/**
 * Apply default permissions to all folders for a group based on group type
 */
async function applyGroupPermissionsToAllFolders(
    groupId: string,
    dataRoomId: string,
    permissions: PermissionSet
) {
    // Get all folders in the data room
    const folders = await prisma.folder.findMany({
        where: { dataRoomId },
        select: { id: true },
    });

    console.log(`  Applying permissions to ${folders.length} folders...`);

    for (const folder of folders) {
        await prisma.folderGroupPermission.upsert({
            where: {
                folderId_groupId: {
                    folderId: folder.id,
                    groupId,
                },
            },
            create: {
                folderId: folder.id,
                groupId,
                ...permissions,
            },
            update: permissions,
        });
    }
}

/**
 * Seed default permissions for all existing groups in all data rooms
 */
async function seedDefaultGroupPermissions() {
    console.log("Seeding default group permissions...");

    // Get all groups
    const groups = await prisma.group.findMany({
        select: {
            id: true,
            name: true,
            type: true,
            dataRoomId: true,
        },
    });

    console.log(`Found ${groups.length} groups to process.`);

    for (const group of groups) {
        // Get data room name for logging
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: group.dataRoomId },
            select: { name: true },
        });
        
        console.log(`\nProcessing group: ${group.name} (${group.type}) in DataRoom: ${dataRoom?.name || 'Unknown'}`);

        const permissions = GROUP_PERMISSION_PRESETS[group.type];

        // Apply permissions to all documents and folders in the data room
        await applyGroupPermissionsToAllDocuments(group.id, group.dataRoomId, permissions);
        await applyGroupPermissionsToAllFolders(group.id, group.dataRoomId, permissions);
    }

    console.log("\n✓ Group permissions seeded successfully!");
}

/**
 * Create an ADMINISTRATOR group for a data room if it doesn't exist
 */
async function ensureAdminGroupExists(dataRoomId: string) {
    const existingAdminGroup = await prisma.group.findFirst({
        where: {
            dataRoomId,
            type: GroupType.ADMINISTRATOR,
        },
    });

    if (existingAdminGroup) {
        console.log(`  Admin group already exists for DataRoom ${dataRoomId}`);
        return existingAdminGroup;
    }

    const adminGroup = await prisma.group.create({
        data: {
            dataRoomId,
            name: "Administrators",
            description: "Full access administrators",
            type: GroupType.ADMINISTRATOR,
            canViewDueDiligenceChecklist: true,
            canManageDocumentPermissions: true,
            canViewGroupUsers: true,
            canManageUsers: true,
            canViewGroupActivity: true,
        },
    });

    console.log(`  Created Admin group for DataRoom ${dataRoomId}`);
    return adminGroup;
}

/**
 * Create a standard USER group for a data room if it doesn't exist
 */
async function ensureUserGroupExists(dataRoomId: string) {
    const existingUserGroup = await prisma.group.findFirst({
        where: {
            dataRoomId,
            type: GroupType.USER,
            name: "Users",
        },
    });

    if (existingUserGroup) {
        console.log(`  User group already exists for DataRoom ${dataRoomId}`);
        return existingUserGroup;
    }

    const userGroup = await prisma.group.create({
        data: {
            dataRoomId,
            name: "Users",
            description: "Standard users with view and download access",
            type: GroupType.USER,
            canViewDueDiligenceChecklist: false,
            canManageDocumentPermissions: false,
            canViewGroupUsers: false,
            canManageUsers: false,
            canViewGroupActivity: false,
        },
    });

    console.log(`  Created User group for DataRoom ${dataRoomId}`);
    return userGroup;
}

/**
 * Ensure all data rooms have at least an Administrator and User group
 */
async function ensureDefaultGroupsExist() {
    console.log("Ensuring default groups exist for all DataRooms...");

    const dataRooms = await prisma.dataRoom.findMany({
        select: { id: true, name: true },
    });

    console.log(`Found ${dataRooms.length} DataRooms to process.`);

    for (const dataRoom of dataRooms) {
        console.log(`\nProcessing DataRoom: ${dataRoom.name}`);
        await ensureAdminGroupExists(dataRoom.id);
        await ensureUserGroupExists(dataRoom.id);
    }

    console.log("\n✓ Default groups ensured for all DataRooms!");
}

/**
 * Main seed function
 */
async function main() {
    console.log("=".repeat(60));
    console.log("VDR Permission Seeding Script");
    console.log("=".repeat(60));

    // Step 1: Ensure all data rooms have default groups
    await ensureDefaultGroupsExist();

    // Step 2: Seed permissions for all groups
    await seedDefaultGroupPermissions();

    console.log("\n" + "=".repeat(60));
    console.log("Permission seeding complete!");
    console.log("=".repeat(60));
}

// Export utilities for use in other scripts
export {
    applyGroupPermissionsToAllDocuments,
    applyGroupPermissionsToAllFolders,
    ensureAdminGroupExists,
    ensureUserGroupExists,
    ensureDefaultGroupsExist,
    seedDefaultGroupPermissions,
};

// Run main if executed directly
main()
    .catch((e) => {
        console.error("Error seeding permissions:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
