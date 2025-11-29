/**
 * Multi-Tenant Type Definitions
 * Version: 4.0.0
 */

import { Tenant, TenantUser, Plan, TenantStatus, TenantUserRole, TenantUserStatus } from "@prisma/client";

// Re-export Prisma enums for convenience
export { TenantStatus, TenantUserRole, TenantUserStatus };

/**
 * Tenant with related data
 */
export interface TenantWithPlan extends Tenant {
  plan: Plan | null;
}

export interface TenantWithUsers extends Tenant {
  tenantUsers: TenantUserWithUser[];
}

export interface TenantFull extends Tenant {
  plan: Plan | null;
  tenantUsers: TenantUserWithUser[];
  _count?: {
    dataRooms: number;
    tenantUsers: number;
  };
}

/**
 * TenantUser with related data
 */
export interface TenantUserWithUser extends TenantUser {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

export interface TenantUserWithTenant extends TenantUser {
  tenant: Tenant;
}

/**
 * Plan feature flags
 */
export interface PlanFeatures {
  watermark?: boolean;
  qa?: boolean;
  audit_log?: boolean;
  custom_branding?: boolean;
  api_access?: boolean;
  sso?: boolean;
  dedicated_support?: boolean;
  advanced_analytics?: boolean;
  custom_domain?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Tenant settings
 */
export interface TenantSettings {
  defaultLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
  allowPublicLinks?: boolean;
  requireTwoFactor?: boolean;
  ipWhitelist?: string[];
  [key: string]: unknown;
}

/**
 * Tenant usage statistics
 */
export interface TenantUsage {
  tenantId: string;
  vdrCount: number;
  maxVdr: number;
  adminUserCount: number;
  maxAdminUsers: number;
  totalUserCount: number;
  storageUsedMb: number;
  maxStorageMb: number;
  daysRemaining: number | null; // null = no expiry
}

/**
 * Tenant context for request handling
 */
export interface TenantContext {
  tenant: Tenant;
  tenantUser: TenantUser;
  plan: Plan | null;
  features: PlanFeatures;
  usage: TenantUsage;
}

/**
 * Create tenant input
 */
export interface CreateTenantInput {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  planId?: string;
  durationDays?: number; // Override plan duration
  settings?: TenantSettings;
}

/**
 * Update tenant input
 */
export interface UpdateTenantInput {
  name?: string;
  description?: string;
  logo?: string;
  status?: TenantStatus;
  planId?: string;
  endDate?: Date | null;
  settings?: TenantSettings;
  customDomain?: string;
}

/**
 * Invite user to tenant input
 */
export interface InviteTenantUserInput {
  email: string;
  name?: string;
  password?: string; // Optional: if not provided, a random password will be generated for admins
  role: TenantUserRole;
  sendEmail?: boolean;
}

/**
 * Update tenant user input
 */
export interface UpdateTenantUserInput {
  role?: TenantUserRole;
  status?: TenantUserStatus;
}

/**
 * Tenant list query params
 */
export interface TenantListParams {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  planId?: string;
  search?: string;
  sortBy?: "name" | "createdAt" | "storageUsedMb";
  sortOrder?: "asc" | "desc";
}

/**
 * Plan limits check result
 */
export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}

/**
 * Tenant validation result
 */
export interface TenantValidation {
  isValid: boolean;
  isActive: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  errors: string[];
}
