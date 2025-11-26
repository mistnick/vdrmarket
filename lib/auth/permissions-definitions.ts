/**
 * Permission definitions for the DataRoom application
 * Defines all available permissions that can be assigned to roles or users
 */

export const PERMISSIONS = {
    // Document permissions
    DOCUMENTS_VIEW: {
        name: "documents.view",
        description: "View documents",
        category: "documents",
    },
    DOCUMENTS_CREATE: {
        name: "documents.create",
        description: "Upload new documents",
        category: "documents",
    },
    DOCUMENTS_EDIT: {
        name: "documents.edit",
        description: "Edit document metadata",
        category: "documents",
    },
    DOCUMENTS_DELETE: {
        name: "documents.delete",
        description: "Delete documents",
        category: "documents",
    },
    DOCUMENTS_DOWNLOAD: {
        name: "documents.download",
        description: "Download documents",
        category: "documents",
    },

    // Folder permissions
    FOLDERS_VIEW: {
        name: "folders.view",
        description: "View folders",
        category: "folders",
    },
    FOLDERS_CREATE: {
        name: "folders.create",
        description: "Create new folders",
        category: "folders",
    },
    FOLDERS_EDIT: {
        name: "folders.edit",
        description: "Edit folder details",
        category: "folders",
    },
    FOLDERS_DELETE: {
        name: "folders.delete",
        description: "Delete folders",
        category: "folders",
    },

    // Link permissions
    LINKS_VIEW: {
        name: "links.view",
        description: "View shared links",
        category: "links",
    },
    LINKS_CREATE: {
        name: "links.create",
        description: "Create new shared links",
        category: "links",
    },
    LINKS_EDIT: {
        name: "links.edit",
        description: "Edit link settings",
        category: "links",
    },
    LINKS_DELETE: {
        name: "links.delete",
        description: "Delete shared links",
        category: "links",
    },

    // Data Room permissions
    DATAROOMS_VIEW: {
        name: "datarooms.view",
        description: "View data rooms",
        category: "datarooms",
    },
    DATAROOMS_CREATE: {
        name: "datarooms.create",
        description: "Create new data rooms",
        category: "datarooms",
    },
    DATAROOMS_EDIT: {
        name: "datarooms.edit",
        description: "Edit data room settings",
        category: "datarooms",
    },
    DATAROOMS_DELETE: {
        name: "datarooms.delete",
        description: "Delete data rooms",
        category: "datarooms",
    },

    // Team permissions
    TEAMS_VIEW_MEMBERS: {
        name: "teams.view_members",
        description: "View team members",
        category: "teams",
    },
    TEAMS_INVITE: {
        name: "teams.invite",
        description: "Invite new team members",
        category: "teams",
    },
    TEAMS_REMOVE_MEMBERS: {
        name: "teams.remove_members",
        description: "Remove team members",
        category: "teams",
    },
    TEAMS_MANAGE_ROLES: {
        name: "teams.manage_roles",
        description: "Change member roles and permissions",
        category: "teams",
    },

    // Settings permissions
    SETTINGS_VIEW: {
        name: "settings.view",
        description: "View team settings",
        category: "settings",
    },
    SETTINGS_EDIT: {
        name: "settings.edit",
        description: "Edit team settings",
        category: "settings",
    },
    SETTINGS_BILLING: {
        name: "settings.billing",
        description: "Manage billing and subscriptions",
        category: "settings",
    },
} as const;

/**
 * Default role permissions
 * Defines which permissions each role has by default
 */
export const ROLE_PERMISSIONS = {
    owner: [
        // Owners have all permissions
        ...Object.values(PERMISSIONS).map((p) => p.name),
    ],
    admin: [
        // Document permissions
        "documents.view",
        "documents.create",
        "documents.edit",
        "documents.delete",
        "documents.download",
        // Folder permissions
        "folders.view",
        "folders.create",
        "folders.edit",
        "folders.delete",
        // Link permissions
        "links.view",
        "links.create",
        "links.edit",
        "links.delete",
        // Data Room permissions
        "datarooms.view",
        "datarooms.create",
        "datarooms.edit",
        "datarooms.delete",
        // Team permissions
        "teams.view_members",
        "teams.invite",
        "teams.remove_members",
        // Settings (no billing)
        "settings.view",
        "settings.edit",
    ],
    member: [
        // Document permissions
        "documents.view",
        "documents.create",
        "documents.edit",
        "documents.download",
        // Folder permissions
        "folders.view",
        "folders.create",
        "folders.edit",
        // Link permissions
        "links.view",
        "links.create",
        "links.edit",
        // Data Room permissions
        "datarooms.view",
        // Team permissions
        "teams.view_members",
        // Settings (read-only)
        "settings.view",
    ],
    viewer: [
        // Document permissions (read-only)
        "documents.view",
        "documents.download",
        // Folder permissions (read-only)
        "folders.view",
        // Link permissions (read-only)
        "links.view",
        // Data Room permissions (read-only)
        "datarooms.view",
        // Team permissions (read-only)
        "teams.view_members",
    ],
};

/**
 * Get all permission names as an array
 */
export function getAllPermissions(): string[] {
    return Object.values(PERMISSIONS).map((p) => p.name);
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, permission: string): boolean {
    const permissions = getRolePermissions(role);
    return permissions.includes(permission);
}
