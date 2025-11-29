import { prisma } from "@/lib/db/prisma";
import { GroupType } from "@prisma/client";

/**
 * Permission checking utilities for DataRoom-based authorization
 * Based on GroupType: ADMINISTRATOR, USER, CUSTOM
 */

/**
 * Permissions by GroupType
 * ADMINISTRATOR: Full access to all features
 * USER: Standard access with configurable group flags
 * CUSTOM: Granular permissions via group flags
 */
export const GROUP_TYPE_PERMISSIONS = {
    ADMINISTRATOR: [
        // Full access - all permissions
        "dataroom.view",
        "dataroom.edit",
        "dataroom.delete",
        "dataroom.manage_members",
        "documents.view",
        "documents.create",
        "documents.edit",
        "documents.delete",
        "documents.download",
        "folders.view",
        "folders.create",
        "folders.edit",
        "folders.delete",
        "links.view",
        "links.create",
        "links.edit",
        "links.delete",
        "settings.view",
        "settings.edit",
        "audit.view",
        "groups.manage",
        "users.manage",
        "qa.manage",
        "recycle_bin.access",
    ],
    USER: [
        // Standard user access
        "dataroom.view",
        "documents.view",
        "documents.download",
        "folders.view",
        "links.view",
    ],
    CUSTOM: [
        // Base permissions for custom groups (extended by group flags)
        "dataroom.view",
        "documents.view",
        "folders.view",
        "links.view",
    ],
};

// Backward compatibility alias (deprecated - use GROUP_TYPE_PERMISSIONS)
export const ROLE_PERMISSIONS = {
    owner: GROUP_TYPE_PERMISSIONS.ADMINISTRATOR,
    admin: GROUP_TYPE_PERMISSIONS.ADMINISTRATOR,
    member: GROUP_TYPE_PERMISSIONS.USER,
    viewer: GROUP_TYPE_PERMISSIONS.CUSTOM,
};

/**
 * Check if a user has a specific permission in a data room
 * Based on GroupType membership
 */
export async function hasPermission(
    userId: string,
    dataRoomId: string,
    permissionName: string
): Promise<boolean> {
    try {
        // Get the user's membership in any group of this data room
        const membership = await prisma.groupMember.findFirst({
            where: {
                userId,
                group: {
                    dataRoomId,
                },
            },
            include: {
                group: true,
            },
        });

        if (!membership) {
            return false; // User is not a member of any group in this data room
        }

        // ADMINISTRATOR group type has all permissions
        if (membership.group.type === GroupType.ADMINISTRATOR) {
            return true;
        }

        // Get base permissions for group type
        const groupTypePermissions =
            GROUP_TYPE_PERMISSIONS[membership.group.type as keyof typeof GROUP_TYPE_PERMISSIONS] || [];
        
        // Check base permissions
        if ((groupTypePermissions as string[]).includes(permissionName)) {
            return true;
        }

        // For CUSTOM groups, check group-specific flags for extended permissions
        if (membership.group.type === GroupType.CUSTOM) {
            // Map permission names to group flags
            if (permissionName === "documents.edit" && membership.group.canManageDocumentPermissions) {
                return true;
            }
            if (permissionName === "users.view" && membership.group.canViewGroupUsers) {
                return true;
            }
            if (permissionName === "users.manage" && membership.group.canManageUsers) {
                return true;
            }
            if (permissionName === "audit.view" && membership.group.canViewGroupActivity) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error("Error checking permission:", error);
        return false;
    }
}

/**
 * Check if a user has multiple permissions (AND logic)
 */
export async function hasAllPermissions(
    userId: string,
    dataRoomId: string,
    permissionNames: string[]
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map((permission) =>
            hasPermission(userId, dataRoomId, permission)
        )
    );
    return checks.every((result) => result === true);
}

/**
 * Check if a user has any of the permissions (OR logic)
 */
export async function hasAnyPermission(
    userId: string,
    dataRoomId: string,
    permissionNames: string[]
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map((permission) =>
            hasPermission(userId, dataRoomId, permission)
        )
    );
    return checks.some((result) => result === true);
}

/**
 * Get all effective permissions for a user in a data room
 * Based on GroupType membership
 */
export async function getUserPermissions(
    userId: string,
    dataRoomId: string
): Promise<string[]> {
    try {
        // Get the user's membership
        const membership = await prisma.groupMember.findFirst({
            where: {
                userId,
                group: {
                    dataRoomId,
                },
            },
            include: {
                group: true,
            },
        });

        if (!membership) {
            return [];
        }

        // ADMINISTRATOR group type has all permissions
        if (membership.group.type === GroupType.ADMINISTRATOR) {
            return GROUP_TYPE_PERMISSIONS.ADMINISTRATOR;
        }

        // Get base permissions for group type
        const basePermissions = [
            ...(GROUP_TYPE_PERMISSIONS[membership.group.type as keyof typeof GROUP_TYPE_PERMISSIONS] || [])
        ];

        // For CUSTOM groups, add permissions based on group flags
        if (membership.group.type === GroupType.CUSTOM) {
            if (membership.group.canManageDocumentPermissions) {
                basePermissions.push("documents.edit", "documents.manage_permissions");
            }
            if (membership.group.canViewGroupUsers) {
                basePermissions.push("users.view");
            }
            if (membership.group.canManageUsers) {
                basePermissions.push("users.manage");
            }
            if (membership.group.canViewGroupActivity) {
                basePermissions.push("audit.view");
            }
            if (membership.group.canViewDueDiligenceChecklist) {
                basePermissions.push("due_diligence.view");
            }
        }

        return [...new Set(basePermissions)]; // Remove duplicates
    } catch (error) {
        console.error("Error getting user permissions:", error);
        return [];
    }
}

/**
 * Check if user is member of a data room
 */
export async function isDataRoomMember(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    const membership = await prisma.groupMember.findFirst({
        where: {
            userId,
            group: {
                dataRoomId,
            },
        },
    });
    return !!membership;
}

/**
 * Check if user is admin of a data room
 * Returns true if user belongs to an ADMINISTRATOR group type
 */
export async function isDataRoomAdmin(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    const membership = await prisma.groupMember.findFirst({
        where: {
            userId,
            group: {
                dataRoomId,
                type: GroupType.ADMINISTRATOR,
            },
        },
    });
    return !!membership;
}

/**
 * Check if user belongs to an ADMINISTRATOR group in the data room
 * Alias for isDataRoomAdmin for clarity
 */
export async function isAdministratorGroup(
    userId: string,
    dataRoomId: string
): Promise<boolean> {
    return isDataRoomAdmin(userId, dataRoomId);
}

/**
 * Get user's group type in a data room
 * Returns the highest privilege group type if user belongs to multiple groups
 */
export async function getUserGroupType(
    userId: string,
    dataRoomId: string
): Promise<GroupType | null> {
    const memberships = await prisma.groupMember.findMany({
        where: {
            userId,
            group: {
                dataRoomId,
            },
        },
        include: {
            group: {
                select: {
                    type: true,
                },
            },
        },
    });

    if (memberships.length === 0) {
        return null;
    }

    // Priority: ADMINISTRATOR > CUSTOM > USER
    const types = memberships.map(m => m.group.type);
    if (types.includes(GroupType.ADMINISTRATOR)) {
        return GroupType.ADMINISTRATOR;
    }
    if (types.includes(GroupType.CUSTOM)) {
        return GroupType.CUSTOM;
    }
    return GroupType.USER;
}
