import { prisma } from "@/lib/db/prisma";

interface AuditLogParams {
  action: string;
  userId: string | null;
  teamId: string | null;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId || undefined,
        teamId: params.teamId || undefined,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata || undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
  }
}
