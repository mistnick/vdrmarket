/**
 * Tenant Usage API
 * GET /api/tenants/usage - Get current tenant usage statistics
 */

import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/tenant";
import type { TenantContext } from "@/lib/tenant";

export async function GET() {
  const result = await requireTenantContext();
  if (result instanceof NextResponse) {
    return result;
  }

  const context = result as TenantContext;

  try {
    const { usage, plan } = context;

    // Calculate percentages
    const vdrPercentage = usage.maxVdr === -1 
      ? 0 
      : Math.round((usage.vdrCount / usage.maxVdr) * 100);
    
    const adminPercentage = usage.maxAdminUsers === -1 
      ? 0 
      : Math.round((usage.adminUserCount / usage.maxAdminUsers) * 100);
    
    const storagePercentage = usage.maxStorageMb === -1 
      ? 0 
      : Math.round((usage.storageUsedMb / usage.maxStorageMb) * 100);

    return NextResponse.json({
      success: true,
      data: {
        vdr: {
          used: usage.vdrCount,
          limit: usage.maxVdr,
          unlimited: usage.maxVdr === -1,
          percentage: vdrPercentage,
        },
        adminUsers: {
          used: usage.adminUserCount,
          limit: usage.maxAdminUsers,
          unlimited: usage.maxAdminUsers === -1,
          percentage: adminPercentage,
        },
        totalUsers: usage.totalUserCount,
        storage: {
          usedMb: usage.storageUsedMb,
          limitMb: usage.maxStorageMb,
          unlimited: usage.maxStorageMb === -1,
          percentage: storagePercentage,
          usedFormatted: formatBytes(usage.storageUsedMb * 1024 * 1024),
          limitFormatted: usage.maxStorageMb === -1 
            ? "Unlimited" 
            : formatBytes(usage.maxStorageMb * 1024 * 1024),
        },
        subscription: {
          plan: plan?.name || "No Plan",
          daysRemaining: usage.daysRemaining,
          expiresAt: usage.daysRemaining !== null 
            ? new Date(Date.now() + usage.daysRemaining * 24 * 60 * 60 * 1000).toISOString()
            : null,
          isExpiring: usage.daysRemaining !== null && usage.daysRemaining <= 30,
        },
      },
    });
  } catch (error) {
    console.error("[TENANT] Error getting usage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get usage statistics" },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
