/**
 * Tenant Module - Main Export
 * Version: 4.0.0
 */

// Types
export * from "./types";

// Context & Resolution
export {
  resolveTenantId,
  setCurrentTenant,
  clearCurrentTenant,
  validateTenant,
  getTenantContext,
  calculateTenantUsage,
  canCreateVdr,
  canAddAdminUser,
  canUseStorage,
  getUserTenants,
  hasAccessToTenant,
  isTenantAdmin,
} from "./context";

// Service
export {
  createTenant,
  updateTenant,
  deleteTenant,
  hardDeleteTenant,
  listTenants,
  getTenantById,
  getTenantBySlug,
  assignPlanToTenant,
  addUserToTenant,
  updateTenantUser,
  removeUserFromTenant,
  listTenantUsers,
  getTenantUsage,
  updateExpiredTenants,
  syncTenantAdminsToGroups,
  ensureAdminGroupExists,
} from "./service";

// Guards & Middleware
export {
  requireAuth,
  requireSuperAdmin,
  requireTenantContext,
  requireTenantAdmin,
  requireTenantAccess,
  tenantMiddleware,
  getTenantIdFromParams,
  withTenantContext,
  withTenantAdmin,
  withSuperAdmin,
} from "./guards";
