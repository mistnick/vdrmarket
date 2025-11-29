/**
 * VDR Authorization Service
 * Implements permission system for Virtual Data Room groups
 * Based on ADMINISTRATOR, USER, and CUSTOM group types
 */

import { prisma } from "@/lib/db/prisma";
import { GroupType } from "@prisma/client";

// Permission enums based on requirements
export enum VDRPermission {
    // Project Management
    MANAGE_PROJECT_SETTINGS = "manage_project_settings",
    ACCESS_RECYCLE_BIN = "access_recycle_bin",
    MANAGE_QA = "manage_qa",
    VIEW_DUE_DILIGENCE_CHECKLIST = "view_due_diligence_checklist",

    // Documents
    VIEW_ALL_DOCUMENTS = "view_all_documents",
    MANAGE_DOCUMENT_PERMISSIONS = "manage_document_permissions",
    AI_SEARCH = "ai_search",

    // Participants
    CREATE_GROUPS_INVITE_USERS = "create_groups_invite_users",
    MANAGE_ALL_GROUPS_USERS = "manage_all_groups_users",
    VIEW_GROUP_USERS = "view_group_users",
    MANAGE_USERS = "manage_users",

    // Reports
    VIEW_ALL_ACTIVITY = "view_all_activity",
    VIEW_OWN_ACTIVITY = "view_own_activity",
    VIEW_GROUP_ACTIVITY = "view_group_activity",
}

/**
 * Get all groups a user belongs to in a specific data room
 */
export async function getUserGroups(userId: string, dataRoomId: string) {
    return prisma.group.findMany({
        where: {
            dataRoomId,
            members: {
                some: {
                    userId,
                },
            },
        },
        include: {
            members: true,
        },
    });
}

/**
 * Check if user has a specific group type in a data room
 */
export async function hasGroupType(
    userId: string,
    dataRoomId: string,
    type: GroupType
): Promise<boolean> {
    const groups = await getUserGroups(userId, dataRoomId);
    return groups.some((group) => group.type === type);
}

/**
 * Check if user is an administrator in the data room
 */
export async function isAdministrator(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return hasGroupType(userId, dataRoomId, "ADMINISTRATOR");
}

/**
 * Permission: Manage Project Settings & Archiving
 * Only ADMINISTRATOR
 */
export async function canManageProjectSettings(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: Access Recycle Bin
 * Only ADMINISTRATOR
 */
export async function canAccessRecycleBin(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: Manage Q&A Setup
 * Only ADMINISTRATOR
 */
export async function canManageQA(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: View Due Diligence Checklist
 * ADMINISTRATOR: Always
 * USER/CUSTOM: Based on group setting
 */
export async function canViewDueDiligenceChecklist(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    // Admin always can
    if (await isAdministrator(userId, dataRoomId)) {
        return true;
    }

    // Check user's groups for permission
    const groups = await getUserGroups(userId, dataRoomId);
    return groups.some((group) => group.canViewDueDiligenceChecklist);
}

/**
 * Permission: View and Manage All Documents
 * Only ADMINISTRATOR
 */
export async function canViewAllDocuments(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: View and Manage Document Permissions
 * ADMINISTRATOR: Always
 * CUSTOM: Based on canManageDocumentPermissions flag
 * USER: Never
 */
export async function canManageDocumentPermissions(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    // Admin always can
    if (await isAdministrator(userId, dataRoomId)) {
        return true;
    }

    // Check CUSTOM groups for permission
    const groups = await getUserGroups(userId, dataRoomId);
    return groups.some(
        (group) =>
            group.type === "CUSTOM" && group.canManageDocumentPermissions
    );
}

/**
 * Permission: AI Search
 * TODO: Currently disabled for USER and CUSTOM, only ADMINISTRATOR
 * May add configuration later
 */
export async function canUseAISearch(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    // TODO: Add project-level AI search enabled/disabled flag
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: Create Groups and Invite Users
 * Only ADMINISTRATOR
 */
export async function canCreateGroupsInviteUsers(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: Manage All Groups and Users
 * Only ADMINISTRATOR
 */
export async function canManageAllGroupsUsers(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isAdministrator(userId, dataRoomId);
}

/**
 * Permission: View Users of Own Group
 * ADMINISTRATOR: Always
 * CUSTOM: Always
 * USER: Based on canViewGroupUsers flag
 */
export async function canViewGroupUsers(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    // Admin always can
    if (await isAdministrator(userId, dataRoomId)) {
        return true;
    }

    const groups = await getUserGroups(userId, dataRoomId);

    // CUSTOM always can view, USER depends on flag
    return groups.some(
        (group) =>
            group.type === "CUSTOM" ||
            (group.type === "USER" && group.canViewGroupUsers)
    );
}

/**
 * Permission: Manage Users
 * ADMINISTRATOR: Can manage all users
 * CUSTOM: Can manage users in own group only (if canManageUsers is true)
 * USER: Never
 * 
 * @param scope - 'all' for managing any user, 'group' for managing users within own group
 */
export async function canManageUsers(
    userId: string,
    dataRoomId: string,
    scope: "all" | "group" = "all"
): Promise<boolean> {
    // Admin always can manage all users
    if (await isAdministrator(userId, dataRoomId)) {
        return true;
    }

    // For 'all' scope, only admin can do it
    if (scope === "all") {
        return false;
    }

    // For 'group' scope, check CUSTOM groups with permission
    const groups = await getUserGroups(userId, dataRoomId);
    return groups.some(
        (group) => group.type === "CUSTOM" && group.canManageUsers
    );
}

/**
 * Permission: View Activity Reports
 * @param scope - 'self', 'group', or 'all'
 */
export async function canViewActivity(
    userId: string,
    dataRoomId: string,
    scope: "self" | "group" | "all"
): Promise<boolean> {
    // Everyone can view own activity
    if (scope === "self") {
        return true;
    }

    // Only admin can view all project activity
    if (scope === "all") {
        return isAdministrator(userId, dataRoomId);
    }

    // For group activity, check permissions
    if (scope === "group") {
        // Admin always can
        if (await isAdministrator(userId, dataRoomId)) {
            return true;
        }

        // Check user's groups for permission
        const groups = await getUserGroups(userId, dataRoomId);
        return groups.some((group) => group.canViewGroupActivity);
    }

    return false;
}

/**
 * Get all effective permissions for a user in a data room
 * Returns an array of permission strings
 */
export async function getUserVDRPermissions(
    userId: string,
    dataRoomId: string
): Promise<VDRPermission[]> {
    const permissions: VDRPermission[] = [];

    // Everyone gets own activity view
    permissions.push(VDRPermission.VIEW_OWN_ACTIVITY);

    // Check each permission
    if (await canManageProjectSettings(userId, dataRoomId)) {
        permissions.push(VDRPermission.MANAGE_PROJECT_SETTINGS);
    }

    if (await canAccessRecycleBin(userId, dataRoomId)) {
        permissions.push(VDRPermission.ACCESS_RECYCLE_BIN);
    }

    if (await canManageQA(userId, dataRoomId)) {
        permissions.push(VDRPermission.MANAGE_QA);
    }

    if (await canViewDueDiligenceChecklist(userId, dataRoomId)) {
        permissions.push(VDRPermission.VIEW_DUE_DILIGENCE_CHECKLIST);
    }

    if (await canViewAllDocuments(userId, dataRoomId)) {
        permissions.push(VDRPermission.VIEW_ALL_DOCUMENTS);
    }

    if (await canManageDocumentPermissions(userId, dataRoomId)) {
        permissions.push(VDRPermission.MANAGE_DOCUMENT_PERMISSIONS);
    }

    if (await canUseAISearch(userId, dataRoomId)) {
        permissions.push(VDRPermission.AI_SEARCH);
    }

    if (await canCreateGroupsInviteUsers(userId, dataRoomId)) {
        permissions.push(VDRPermission.CREATE_GROUPS_INVITE_USERS);
    }

    if (await canManageAllGroupsUsers(userId, dataRoomId)) {
        permissions.push(VDRPermission.MANAGE_ALL_GROUPS_USERS);
    }

    if (await canViewGroupUsers(userId, dataRoomId)) {
        permissions.push(VDRPermission.VIEW_GROUP_USERS);
    }

    if (await canManageUsers(userId, dataRoomId, "group")) {
        permissions.push(VDRPermission.MANAGE_USERS);
    }

    if (await canViewActivity(userId, dataRoomId, "all")) {
        permissions.push(VDRPermission.VIEW_ALL_ACTIVITY);
    }

    if (await canViewActivity(userId, dataRoomId, "group")) {
        permissions.push(VDRPermission.VIEW_GROUP_ACTIVITY);
    }

    return permissions;
}
