/**
 * Tenant Service
 * Business logic for tenant management
 * Version: 4.0.0
 */

import { prisma } from "@/lib/db/prisma";
import { 
  TenantStatus, 
  TenantUserRole, 
  TenantUserStatus,
  GroupType,
} from "@prisma/client";
import type {
  CreateTenantInput,
  UpdateTenantInput,
  InviteTenantUserInput,
  UpdateTenantUserInput,
  TenantListParams,
  TenantFull,
  TenantUsage,
} from "./types";
import { calculateTenantUsage, canAddAdminUser } from "./context";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Add a tenant admin to all ADMINISTRATOR groups in the tenant's data rooms
 * This ensures TENANT_ADMIN users have full access to all data rooms
 */
async function addTenantAdminToAllAdminGroups(tenantId: string, userId: string): Promise<void> {
  // Find all ADMINISTRATOR groups in data rooms belonging to this tenant
  const adminGroups = await prisma.group.findMany({
    where: {
      type: GroupType.ADMINISTRATOR,
      dataRoom: {
        tenantId,
        archivedAt: null,
      },
    },
    select: { id: true },
  });

  if (adminGroups.length === 0) {
    console.log(`[TENANT] No admin groups found for tenant ${tenantId}`);
    return;
  }

  // Add user to each admin group (skip if already member)
  for (const group of adminGroups) {
    const existingMembership = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });

    if (!existingMembership) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: "admin",
        },
      });
      console.log(`[TENANT] Added user ${userId} to admin group ${group.id}`);
    }
  }

  console.log(`[TENANT] Synced admin access: user ${userId} added to ${adminGroups.length} admin groups in tenant ${tenantId}`);
}

/**
 * Create a new tenant
 */
export async function createTenant(
  input: CreateTenantInput,
  createdByUserId?: string
): Promise<TenantFull> {
  const { name, slug, description, logo, planId, durationDays, settings } = input;

  // Calculate end date if plan has duration
  let endDate: Date | undefined;
  if (durationDays) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
  } else if (planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { durationDays: true },
    });
    if (plan?.durationDays) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);
    }
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description,
      logo,
      planId,
      endDate,
      settings: settings ? JSON.parse(JSON.stringify(settings)) : undefined,
    },
    include: {
      plan: true,
      tenantUsers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // Log tenant creation
  await prisma.tenantAuditLog.create({
    data: {
      tenantId: tenant.id,
      userId: createdByUserId,
      action: "tenant.created",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: { name, slug, planId },
    },
  });

  return tenant as TenantFull;
}

/**
 * Update a tenant
 */
export async function updateTenant(
  tenantId: string,
  input: UpdateTenantInput,
  updatedByUserId?: string
): Promise<TenantFull> {
  // Convert settings to JSON-safe format if present
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
  };
  if (input.settings) {
    data.settings = JSON.parse(JSON.stringify(input.settings));
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
    include: {
      plan: true,
      tenantUsers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // Log tenant update
  await prisma.tenantAuditLog.create({
    data: {
      tenantId: tenant.id,
      userId: updatedByUserId,
      action: "tenant.updated",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return tenant as TenantFull;
}

/**
 * Soft delete a tenant (GDPR compliant)
 */
export async function deleteTenant(
  tenantId: string,
  deletedByUserId?: string
): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      status: TenantStatus.DELETED,
      deletedAt: new Date(),
    },
  });

  // Log tenant deletion
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      userId: deletedByUserId,
      action: "tenant.deleted",
      resourceType: "tenant",
      resourceId: tenantId,
    },
  });
}

/**
 * Hard delete a tenant and all data (use with caution)
 */
export async function hardDeleteTenant(tenantId: string): Promise<void> {
  // Delete in order to respect foreign keys
  await prisma.$transaction([
    // Delete all data rooms (cascades to documents, folders, etc.)
    prisma.dataRoom.deleteMany({ where: { tenantId } }),
    // Delete tenant users
    prisma.tenantUser.deleteMany({ where: { tenantId } }),
    // Delete tenant audit logs
    prisma.tenantAuditLog.deleteMany({ where: { tenantId } }),
    // Delete tenant
    prisma.tenant.delete({ where: { id: tenantId } }),
  ]);
}

/**
 * List tenants with pagination and filters
 */
export async function listTenants(params: TenantListParams = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    planId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where = {
    ...(status && { status }),
    ...(planId && { planId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    deletedAt: null,
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        plan: true,
        _count: {
          select: {
            dataRooms: true,
            tenantUsers: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    data: tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<TenantFull | null> {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: true,
      tenantUsers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          dataRooms: true,
          tenantUsers: true,
        },
      },
    },
  }) as Promise<TenantFull | null>;
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      plan: true,
    },
  });
}

/**
 * Assign plan to tenant
 */
export async function assignPlanToTenant(
  tenantId: string,
  planId: string,
  updatedByUserId?: string
): Promise<TenantFull> {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  // Calculate new end date if plan has duration
  let endDate: Date | undefined;
  if (plan.durationDays) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
  }

  return updateTenant(
    tenantId,
    { planId, endDate },
    updatedByUserId
  );
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const randomBytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Add user to tenant
 * For TENANT_ADMIN role: if user doesn't exist, creates them with a password
 */
export async function addUserToTenant(
  tenantId: string,
  input: InviteTenantUserInput,
  invitedByUserId: string
) {
  const { email, name, password, role } = input;

  // Check admin limit if adding admin
  if (role === TenantUserRole.TENANT_ADMIN) {
    const canAdd = await canAddAdminUser(tenantId);
    if (!canAdd.allowed) {
      throw new Error(canAdd.reason);
    }
  }

  // Find existing user
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  let generatedPassword: string | undefined;
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    
    // For TENANT_ADMIN, create user with password (active immediately)
    // For other roles, create as pending invite
    if (role === TenantUserRole.TENANT_ADMIN) {
      // Generate password if not provided
      generatedPassword = password || generateSecurePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);
      
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
          password: hashedPassword,
          isActive: true,
          status: "ACTIVE",
        },
      });
      
      console.log(`[TENANT] Created new admin user: ${email} for tenant ${tenantId}`);
    } else {
      // Create pending user for non-admin roles
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name,
          status: "PENDING_INVITE",
        },
      });
    }
  }

  // Create tenant user relationship
  const tenantUser = await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId: user.id,
      },
    },
    create: {
      tenantId,
      userId: user.id,
      role,
      status: (role === TenantUserRole.TENANT_ADMIN || user.password) 
        ? TenantUserStatus.ACTIVE 
        : TenantUserStatus.PENDING,
      invitedAt: new Date(),
      invitedById: invitedByUserId,
      joinedAt: (role === TenantUserRole.TENANT_ADMIN || user.password) ? new Date() : null,
    },
    update: {
      role,
      status: (role === TenantUserRole.TENANT_ADMIN || user.password) 
        ? TenantUserStatus.ACTIVE 
        : TenantUserStatus.PENDING,
      invitedAt: new Date(),
      invitedById: invitedByUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Log action
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      userId: invitedByUserId,
      action: isNewUser ? "tenant_user.created" : "tenant_user.invited",
      resourceType: "tenant_user",
      resourceId: tenantUser.id,
      metadata: { email, role, isNewUser },
    },
  });

  // If TENANT_ADMIN, add to all ADMINISTRATOR groups of tenant's data rooms
  if (role === TenantUserRole.TENANT_ADMIN) {
    await addTenantAdminToAllAdminGroups(tenantId, user.id);
  }

  // Return with generated password if applicable (for display to admin)
  return {
    ...tenantUser,
    generatedPassword: generatedPassword,
    isNewUser,
  };
}

/**
 * Update tenant user
 */
export async function updateTenantUser(
  tenantId: string,
  userId: string,
  input: UpdateTenantUserInput,
  updatedByUserId: string
) {
  // Check admin limit if promoting to admin
  if (input.role === TenantUserRole.TENANT_ADMIN) {
    const currentTenantUser = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    
    if (currentTenantUser?.role !== TenantUserRole.TENANT_ADMIN) {
      const canAdd = await canAddAdminUser(tenantId);
      if (!canAdd.allowed) {
        throw new Error(canAdd.reason);
      }
    }
  }

  const tenantUser = await prisma.tenantUser.update({
    where: {
      tenantId_userId: { tenantId, userId },
    },
    data: {
      ...input,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Log action
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      userId: updatedByUserId,
      action: "tenant_user.updated",
      resourceType: "tenant_user",
      resourceId: tenantUser.id,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return tenantUser;
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenant(
  tenantId: string,
  userId: string,
  removedByUserId: string
): Promise<void> {
  await prisma.tenantUser.delete({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  // Log action
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      userId: removedByUserId,
      action: "tenant_user.removed",
      resourceType: "tenant_user",
      metadata: { removedUserId: userId },
    },
  });
}

/**
 * List tenant users
 */
export async function listTenantUsers(
  tenantId: string,
  params: { status?: TenantUserStatus; role?: TenantUserRole } = {}
) {
  return prisma.tenantUser.findMany({
    where: {
      tenantId,
      ...(params.status && { status: params.status }),
      ...(params.role && { role: params.role }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isActive: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get tenant usage statistics
 */
export async function getTenantUsage(tenantId: string): Promise<TenantUsage> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return calculateTenantUsage(tenantId, tenant.plan);
}

/**
 * Check and update expired tenants
 * Should be run as a cron job
 */
export async function updateExpiredTenants(): Promise<number> {
  const result = await prisma.tenant.updateMany({
    where: {
      status: TenantStatus.ACTIVE,
      endDate: {
        lt: new Date(),
      },
    },
    data: {
      status: TenantStatus.INACTIVE,
    },
  });

  return result.count;
}

/**
 * Sync all tenant admins to ADMINISTRATOR groups
 * Call this to fix existing tenants where admins are not in admin groups
 */
export async function syncTenantAdminsToGroups(tenantId: string): Promise<{
  usersProcessed: number;
  groupsUpdated: number;
}> {
  // Get all TENANT_ADMIN users for this tenant
  const tenantAdmins = await prisma.tenantUser.findMany({
    where: {
      tenantId,
      role: TenantUserRole.TENANT_ADMIN,
      status: TenantUserStatus.ACTIVE,
    },
    select: { userId: true, user: { select: { email: true } } },
  });

  // Find all ADMINISTRATOR groups in tenant's data rooms
  const adminGroups = await prisma.group.findMany({
    where: {
      type: GroupType.ADMINISTRATOR,
      dataRoom: {
        tenantId,
        archivedAt: null,
      },
    },
    select: { id: true, dataRoom: { select: { name: true } } },
  });

  let groupsUpdated = 0;

  // For each admin user, ensure they're in all admin groups
  for (const admin of tenantAdmins) {
    for (const group of adminGroups) {
      const existingMembership = await prisma.groupMember.findFirst({
        where: { groupId: group.id, userId: admin.userId },
      });

      if (!existingMembership) {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: admin.userId,
            role: "admin",
          },
        });
        groupsUpdated++;
        console.log(`[TENANT] Added ${admin.user.email} to admin group in "${group.dataRoom.name}"`);
      }
    }
  }

  console.log(`[TENANT] Sync complete: ${tenantAdmins.length} admins, ${adminGroups.length} groups, ${groupsUpdated} memberships added`);

  return {
    usersProcessed: tenantAdmins.length,
    groupsUpdated,
  };
}

/**
 * Create default administrator group for a data room if it doesn't exist
 * And populate it with all tenant admins
 */
export async function ensureAdminGroupExists(dataRoomId: string): Promise<void> {
  const dataRoom = await prisma.dataRoom.findUnique({
    where: { id: dataRoomId },
    include: {
      groups: {
        where: { type: GroupType.ADMINISTRATOR },
      },
    },
  });

  if (!dataRoom) {
    throw new Error("Data room not found");
  }

  // If admin group already exists, sync tenant admins to it
  if (dataRoom.groups.length > 0) {
    const adminGroup = dataRoom.groups[0];
    const tenantAdmins = await prisma.tenantUser.findMany({
      where: {
        tenantId: dataRoom.tenantId!,
        role: TenantUserRole.TENANT_ADMIN,
        status: TenantUserStatus.ACTIVE,
      },
      select: { userId: true },
    });

    for (const admin of tenantAdmins) {
      const existingMembership = await prisma.groupMember.findFirst({
        where: { groupId: adminGroup.id, userId: admin.userId },
      });

      if (!existingMembership) {
        await prisma.groupMember.create({
          data: {
            groupId: adminGroup.id,
            userId: admin.userId,
            role: "admin",
          },
        });
      }
    }
    return;
  }

  // Create admin group with all tenant admins
  const tenantAdmins = await prisma.tenantUser.findMany({
    where: {
      tenantId: dataRoom.tenantId!,
      role: TenantUserRole.TENANT_ADMIN,
      status: TenantUserStatus.ACTIVE,
    },
    select: { userId: true },
  });

  await prisma.group.create({
    data: {
      dataRoomId,
      name: "Administrators",
      description: "Default administrator group",
      type: GroupType.ADMINISTRATOR,
      canViewDueDiligenceChecklist: true,
      canManageDocumentPermissions: true,
      canViewGroupUsers: true,
      canManageUsers: true,
      canViewGroupActivity: true,
      members: {
        create: tenantAdmins.map((admin) => ({
          userId: admin.userId,
          role: "admin",
        })),
      },
    },
  });

  console.log(`[TENANT] Created admin group for data room ${dataRoomId} with ${tenantAdmins.length} admins`);
}