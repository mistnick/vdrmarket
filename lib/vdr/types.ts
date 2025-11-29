/**
 * VDR TypeScript Type Definitions
 * Shared types for the Virtual Data Room system
 */

import { Group, GroupMember, User } from "@prisma/client";

// Group with members
export type GroupWithMembers = Group & {
    members: GroupMember[];
};

// Group with full user details
export type GroupWithUsers = Group & {
    members: (GroupMember & {
        user: User;
    })[];
};

// User invitation payload
export interface UserInvitationPayload {
    email: string;
    dataRoomId: string;
    groupIds: string[];
    accessType?: "UNLIMITED" | "LIMITED";
    accessStartAt?: Date;
    accessEndAt?: Date;
    allowedIps?: string[];
    require2FA?: boolean;
}

// Group creation payload
export interface CreateGroupPayload {
    name: string;
    description?: string;
    type: "ADMINISTRATOR" | "USER" | "CUSTOM";
    dataRoomId: string;

    // Custom permissions (for USER and CUSTOM)
    canViewDueDiligenceChecklist?: boolean;
    canManageDocumentPermissions?: boolean;
    canViewGroupUsers?: boolean;
    canManageUsers?: boolean;
    canViewGroupActivity?: boolean;
}

// Group update payload
export interface UpdateGroupPayload {
    name?: string;
    description?: string;

    // Custom permissions
    canViewDueDiligenceChecklist?: boolean;
    canManageDocumentPermissions?: boolean;
    canViewGroupUsers?: boolean;
    canManageUsers?: boolean;
    canViewGroupActivity?: boolean;
}

// User update payload for VDR
export interface UpdateVDRUserPayload {
    status?: "PENDING_INVITE" | "ACTIVE" | "DEACTIVATED" | "EXPIRED";
    accessType?: "UNLIMITED" | "LIMITED";
    accessStartAt?: Date | null;
    accessEndAt?: Date | null;
    allowedIps?: string[] | null;
    require2FA?: boolean;
}

// Activity log filter
export interface ActivityLogFilter {
    dataRoomId: string;
    userId?: string;
    groupId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resourceType?: string;
}

// Due diligence item
export interface DueDiligenceItemPayload {
    title: string;
    description?: string;
    order?: number;
}
