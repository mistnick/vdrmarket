import { prisma } from "@/lib/db/prisma";
import { ROLE_PERMISSIONS, getAllPermissions } from "./permissions-definitions";

/**
 * Permission checking utilities
 * Provides functions to check if a user has specific permissions
 */

/**
 * Check if a user has a specific permission in a team
 * Takes into account both role-based and user-specific permissions
 */
export async function hasPermission(
    userId: string,
    teamId: string,
    permissionName: string
): Promise<boolean> {
    try {
        // Get the user's role in the team
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });

        if (!teamMember) {
            return false; // User is not a member of the team
        }

        // Check for user-specific permission override
        const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
        });

        if (permission) {
            const userPermission = await prisma.userPermission.findUnique({
                where: {
                    userId_teamId_permissionId: {
                        userId,
                        teamId,
                        permissionId: permission.id,
                    },
                },
            });

            // If user has a specific permission override, use that
            if (userPermission) {
                return userPermission.granted;
            }
        }

        // Fall back to role-based permissions
        const rolePermissions =
            ROLE_PERMISSIONS[teamMember.role as keyof typeof ROLE_PERMISSIONS] || [];
        return (rolePermissions as string[]).includes(permissionName);
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
    teamId: string,
    permissionNames: string[]
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map((permission) =>
            hasPermission(userId, teamId, permission)
        )
    );
    return checks.every((result) => result === true);
}

/**
 * Check if a user has any of the permissions (OR logic)
 */
export async function hasAnyPermission(
    userId: string,
    teamId: string,
    permissionNames: string[]
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map((permission) =>
            hasPermission(userId, teamId, permission)
        )
    );
    return checks.some((result) => result === true);
}

/**
 * Get all effective permissions for a user in a team
 * Combines role-based and user-specific permissions
 */
export async function getUserPermissions(
    userId: string,
    teamId: string
): Promise<string[]> {
    try {
        // Get the user's role
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });

        if (!teamMember) {
            return [];
        }

        // Get role-based permissions
        const rolePermissions =
            ROLE_PERMISSIONS[teamMember.role as keyof typeof ROLE_PERMISSIONS] || [];

        // Get user-specific permission overrides
        const userPermissions = await prisma.userPermission.findMany({
            where: {
                userId,
                teamId,
            },
            include: {
                permission: true,
            },
        });

        // Start with role permissions
        const permissions = new Set(rolePermissions);

        // Apply user-specific overrides
        for (const userPerm of userPermissions) {
            if (userPerm.granted) {
                permissions.add(userPerm.permission.name);
            } else {
                permissions.delete(userPerm.permission.name);
            }
        }

        return Array.from(permissions);
    } catch (error) {
        console.error("Error getting user permissions:", error);
        return [];
    }
}

/**
 * Seed default permissions into the database
 * Should be run once during setup
 */
export async function seedPermissions() {
    const { PERMISSIONS } = await import("./permissions-definitions");

    const permissionsToSeed = Object.values(PERMISSIONS);

    for (const permissionDef of permissionsToSeed) {
        await prisma.permission.upsert({
            where: { name: permissionDef.name },
            update: {
                description: permissionDef.description,
                category: permissionDef.category,
            },
            create: {
                name: permissionDef.name,
                description: permissionDef.description,
                category: permissionDef.category,
            },
        });
    }

    console.log(`Seeded ${permissionsToSeed.length} permissions`);
}
