/**
 * Tenant Context Hook
 * React hook for tenant management in client components
 * Version: 4.0.0
 */

"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import useSWR from "swr";

interface TenantBasic {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  plan: {
    id: string;
    name: string;
  } | null;
}

interface TenantUsage {
  vdr: {
    used: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
  };
  adminUsers: {
    used: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
  };
  totalUsers: number;
  storage: {
    usedMb: number;
    limitMb: number;
    unlimited: boolean;
    percentage: number;
    usedFormatted: string;
    limitFormatted: string;
  };
  subscription: {
    plan: string;
    daysRemaining: number | null;
    expiresAt: string | null;
    isExpiring: boolean;
  };
}

interface TenantCurrent {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    status: string;
  };
  role: string;
  plan: {
    id: string;
    name: string;
  } | null;
  features: Record<string, boolean>;
  usage: {
    vdrCount: number;
    maxVdr: number;
    adminUserCount: number;
    maxAdminUsers: number;
    totalUserCount: number;
    storageUsedMb: number;
    maxStorageMb: number;
    daysRemaining: number | null;
  };
}

interface TenantContextValue {
  // Current tenant
  currentTenant: TenantCurrent | null;
  isLoading: boolean;
  error: Error | null;
  
  // Available tenants
  tenants: TenantBasic[];
  tenantsLoading: boolean;
  
  // Actions
  selectTenant: (tenantId: string) => Promise<void>;
  clearTenant: () => Promise<void>;
  refreshTenant: () => void;
  refreshTenants: () => void;
  
  // Helpers
  isTenantAdmin: boolean;
  hasTenant: boolean;
  hasFeature: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch");
    throw error;
  }
  return res.json();
};

export function TenantProvider({ children }: { children: ReactNode }) {
  const [isSelecting, setIsSelecting] = useState(false);

  // Fetch current tenant
  const { 
    data: currentData, 
    error: currentError, 
    mutate: mutateCurrent,
    isLoading: currentLoading,
  } = useSWR<{ success: boolean; data: TenantCurrent | null }>(
    "/api/tenants/current",
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Fetch available tenants
  const {
    data: tenantsData,
    error: tenantsError,
    mutate: mutateTenants,
    isLoading: tenantsLoading,
  } = useSWR<{ success: boolean; data: TenantBasic[] }>(
    "/api/tenants",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const currentTenant = currentData?.data || null;
  const tenants = tenantsData?.data || [];

  // Auto-select first tenant if none selected
  useEffect(() => {
    if (!currentLoading && !tenantsLoading && !currentTenant && tenants.length > 0 && !isSelecting) {
      // Automatically select the first available tenant
      selectTenantInternal(tenants[0].id);
    }
  }, [currentLoading, tenantsLoading, currentTenant, tenants, isSelecting]);

  const selectTenantInternal = useCallback(async (tenantId: string) => {
    setIsSelecting(true);
    try {
      const res = await fetch("/api/tenants/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        // Log the error but don't throw for access denied - the user might need to select another tenant
        console.error(`[useTenant] Failed to select tenant ${tenantId}:`, data.error);
        // Re-fetch tenants list in case the user doesn't have access anymore
        await mutateTenants();
        return;
      }

      // Refresh current tenant
      await mutateCurrent();
    } finally {
      setIsSelecting(false);
    }
  }, [mutateCurrent, mutateTenants]);

  const selectTenant = useCallback(async (tenantId: string) => {
    await selectTenantInternal(tenantId);
  }, [selectTenantInternal]);

  const clearTenant = useCallback(async () => {
    try {
      await fetch("/api/tenants/current", { method: "DELETE" });
      await mutateCurrent();
    } catch (error) {
      console.error("Failed to clear tenant:", error);
    }
  }, [mutateCurrent]);

  const refreshTenant = useCallback(() => {
    mutateCurrent();
  }, [mutateCurrent]);

  const refreshTenants = useCallback(() => {
    mutateTenants();
  }, [mutateTenants]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!currentTenant?.features) return false;
    return !!currentTenant.features[feature];
  }, [currentTenant]);

  const value: TenantContextValue = {
    currentTenant,
    isLoading: currentLoading || isSelecting,
    error: currentError || tenantsError || null,
    tenants,
    tenantsLoading,
    selectTenant,
    clearTenant,
    refreshTenant,
    refreshTenants,
    isTenantAdmin: currentTenant?.role === "TENANT_ADMIN",
    hasTenant: !!currentTenant,
    hasFeature,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

/**
 * Hook to get tenant usage statistics
 */
export function useTenantUsage() {
  const { currentTenant } = useTenant();

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: TenantUsage }>(
    currentTenant ? "/api/tenants/usage" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    usage: data?.data || null,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook to check if action is allowed by plan limits
 */
export function usePlanLimits() {
  const { usage } = useTenantUsage();

  const canCreateVdr = useCallback(() => {
    if (!usage) return { allowed: false, reason: "Loading..." };
    if (usage.vdr.unlimited) return { allowed: true };
    if (usage.vdr.used >= usage.vdr.limit) {
      return { 
        allowed: false, 
        reason: `VDR limit reached (${usage.vdr.used}/${usage.vdr.limit})` 
      };
    }
    return { allowed: true };
  }, [usage]);

  const canAddAdmin = useCallback(() => {
    if (!usage) return { allowed: false, reason: "Loading..." };
    if (usage.adminUsers.unlimited) return { allowed: true };
    if (usage.adminUsers.used >= usage.adminUsers.limit) {
      return { 
        allowed: false, 
        reason: `Admin limit reached (${usage.adminUsers.used}/${usage.adminUsers.limit})` 
      };
    }
    return { allowed: true };
  }, [usage]);

  const canUseStorage = useCallback((additionalMb: number) => {
    if (!usage) return { allowed: false, reason: "Loading..." };
    if (usage.storage.unlimited) return { allowed: true };
    if (usage.storage.usedMb + additionalMb > usage.storage.limitMb) {
      return { 
        allowed: false, 
        reason: `Storage limit would be exceeded` 
      };
    }
    return { allowed: true };
  }, [usage]);

  return {
    canCreateVdr,
    canAddAdmin,
    canUseStorage,
    isExpiring: usage?.subscription.isExpiring || false,
    daysRemaining: usage?.subscription.daysRemaining,
  };
}
