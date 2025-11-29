/**
 * VDR Module Exports
 * Centralized export for all VDR-related functionality
 */

// Authorization
export * from "./authorization";
export * from "./document-permissions";
export * from "./user-access";

// Types
export type { DocumentPermissions, FolderPermissions } from "./document-permissions";
export type { AccessContext, AccessValidation } from "./user-access";
export { VDRPermission } from "./authorization";
export { UserStatus, AccessType } from "./user-access";
