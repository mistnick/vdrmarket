"use client";

import { Building2, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";

export function TenantSwitcher() {
  const router = useRouter();
  const { tenants, currentTenant, selectTenant, tenantsLoading } = useTenant();

  if (tenantsLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!currentTenant) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-[200px]"
      >
        <Building2 className="mr-2 h-4 w-4" />
        No Organization
      </Button>
    );
  }

  const handleSelectTenant = async (tenantId: string) => {
    await selectTenant(tenantId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[200px] justify-between">
          <div className="flex items-center truncate">
            <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{currentTenant.tenant.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSelectTenant(tenant.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tenant.name}</span>
              </div>
              {currentTenant.tenant.id === tenant.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
