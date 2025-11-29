/**
 * VDR System Integration Export
 * 
 * This file exports all VDR-related components for easy import
 */

// Group Management
export { GroupList } from './groups/group-list';
export { GroupFormDialog } from './groups/group-form-dialog';

// User Management
export { UserList } from './users/user-list';
export { InviteUserDialog } from './users/invite-user-dialog';

// Permissions
export { PermissionEditorDialog } from './permissions/permission-editor-dialog';

// Documents & Permissions
export { DocumentPermissionsManager } from './documents';

// Activity & Monitoring
export { ActivityLogView } from './activity/activity-log-view';

// Recycle Bin
export { RecycleBin } from './recycle-bin/recycle-bin';

// Dashboard Widgets
export { VDRQuickAccess } from '../dashboard/vdr-quick-access';
export { VDRStatsCard } from '../dashboard/vdr-stats-card';
