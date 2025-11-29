/**
 * VDR User Access Validation Service
 * Validates user access based on status, time windows, IP restrictions, and 2FA
 */

import { prisma } from "@/lib/db/prisma";

export interface AccessContext {
    ipAddress?: string;
    has2FA?: boolean;
}

export interface AccessValidation {
    allowed: boolean;
    reason?: string;
    requiresActivation?: boolean;
    requires2FA?: boolean;
}

// User status enum values
export const UserStatus = {
    PENDING_INVITE: "PENDING_INVITE",
    ACTIVE: "ACTIVE",
    DEACTIVATED: "DEACTIVATED",
    EXPIRED: "EXPIRED",
} as const;

export const AccessType = {
    UNLIMITED: "UNLIMITED",
    LIMITED: "LIMITED",
} as const;

/**
 * Validate if a user has access to a data room
 * Checks: status, time window, IP restrictions, 2FA
 */
export async function validateUserAccess(
    userId: string,
    dataRoomId: string,
    context: AccessContext = {}
): Promise<AccessValidation> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            status: true,
            accessType: true,
            accessStartAt: true,
            accessEndAt: true,
            allowedIps: true,
            twoFactorEnabled: true,
            isActive: true,
        },
    });

    if (!user) {
        return {
            allowed: false,
            reason: "User not found",
        };
    }

    // Check if user account is active
    if (!user.isActive) {
        return {
            allowed: false,
            reason: "User account is inactive",
        };
    }

    // Check user status
    if (user.status === UserStatus.PENDING_INVITE) {
        return {
            allowed: false,
            reason: "User has not completed account activation",
            requiresActivation: true,
        };
    }

    if (user.status === UserStatus.DEACTIVATED) {
        return {
            allowed: false,
            reason: "User account has been deactivated",
        };
    }

    if (user.status === UserStatus.EXPIRED) {
        return {
            allowed: false,
            reason: "User access has expired",
        };
    }

    // Check access time window for LIMITED access
    if (user.accessType === AccessType.LIMITED) {
        const now = new Date();

        if (user.accessStartAt && now < user.accessStartAt) {
            return {
                allowed: false,
                reason: `Access not yet available. Starts at ${user.accessStartAt.toISOString()}`,
            };
        }

        if (user.accessEndAt && now > user.accessEndAt) {
            return {
                allowed: false,
                reason: `Access period has ended. Ended at ${user.accessEndAt.toISOString()}`,
            };
        }
    }

    // Check IP restrictions
    if (user.allowedIps && context.ipAddress) {
        const allowed = await isIpAllowed(userId, context.ipAddress);
        if (!allowed) {
            return {
                allowed: false,
                reason: "Access denied from this IP address",
            };
        }
    }

    // Check 2FA requirement
    if (user.twoFactorEnabled && !context.has2FA) {
        return {
            allowed: false,
            reason: "Two-factor authentication required",
            requires2FA: true,
        };
    }

    // Check if user is member of any group in this data room
    const groupMembership = await prisma.groupMember.findFirst({
        where: {
            userId,
            group: {
                dataRoomId,
            },
        },
    });

    if (!groupMembership) {
        return {
            allowed: false,
            reason: "User is not a member of this data room",
        };
    }

    return {
        allowed: true,
    };
}

/**
 * Check if user account is active
 */
export async function isUserActive(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, isActive: true },
    });

    return (
        user !== null &&
        user.isActive &&
        user.status === UserStatus.ACTIVE
    );
}

/**
 * Check if current time is within user's access window
 */
export async function isWithinAccessWindow(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            accessType: true,
            accessStartAt: true,
            accessEndAt: true,
        },
    });

    if (!user) {
        return false;
    }

    // UNLIMITED access always valid
    if (user.accessType === AccessType.UNLIMITED) {
        return true;
    }

    const now = new Date();

    // Check start date
    if (user.accessStartAt && now < user.accessStartAt) {
        return false;
    }

    // Check end date
    if (user.accessEndAt && now > user.accessEndAt) {
        return false;
    }

    return true;
}

/**
 * Check if IP address is allowed for user
 * Supports individual IPs and CIDR ranges
 */
export async function isIpAllowed(
    userId: string,
    ipAddress: string
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { allowedIps: true },
    });

    if (!user || !user.allowedIps) {
        return true; // No IP restrictions
    }

    const allowedIps = user.allowedIps as string[];

    // Check if IP matches any allowed IP/CIDR
    for (const allowedIp of allowedIps) {
        if (matchIpOrCidr(ipAddress, allowedIp)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if user requires 2FA
 */
export async function require2FA(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
}

/**
 * Update user status
 */
export async function updateUserStatus(
    userId: string,
    status: string
): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { status },
    });
}

/**
 * Set user access window
 */
export async function setUserAccessWindow(
    userId: string,
    accessType: string,
    startAt?: Date,
    endAt?: Date
): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            accessType,
            accessStartAt: startAt,
            accessEndAt: endAt,
        },
    });
}

/**
 * Add allowed IP for user
 */
export async function addAllowedIp(
    userId: string,
    ip: string
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { allowedIps: true },
    });

    const currentIps = (user?.allowedIps as string[]) || [];
    if (!currentIps.includes(ip)) {
        currentIps.push(ip);
        await prisma.user.update({
            where: { id: userId },
            data: { allowedIps: currentIps },
        });
    }
}

/**
 * Remove allowed IP for user
 */
export async function removeAllowedIp(
    userId: string,
    ip: string
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { allowedIps: true },
    });

    const currentIps = (user?.allowedIps as string[]) || [];
    const updatedIps = currentIps.filter((allowedIp) => allowedIp !== ip);

    await prisma.user.update({
        where: { id: userId },
        data: { allowedIps: updatedIps },
    });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if an IP address matches an IP or CIDR range
 * Simple implementation - for production, use a library like 'ip-range-check'
 */
function matchIpOrCidr(ip: string, allowedIp: string): boolean {
    // Exact match
    if (ip === allowedIp) {
        return true;
    }

    // TODO: Implement CIDR matching
    // For now, only exact match is supported
    // Consider using libraries like 'ipaddr.js' or 'ip-range-check' for production

    return false;
}
