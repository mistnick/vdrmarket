"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  Activity,
  HardDrive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalPlans: number;
  totalUsers: number;
  totalDataRooms: number;
  totalStorageUsedMb: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [tenantsRes, plansRes] = await Promise.all([
          fetch("/api/admin/tenants"),
          fetch("/api/admin/plans"),
        ]);

        const tenantsData = await tenantsRes.json();
        const plansData = await plansRes.json();

        const tenants = tenantsData.data || [];
        const plans = plansData.data || [];

        setStats({
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t: { status: string }) => t.status === "ACTIVE").length,
          totalPlans: plans.length,
          totalUsers: tenants.reduce((sum: number, t: { _count?: { tenantUsers: number } }) => 
            sum + (t._count?.tenantUsers || 0), 0),
          totalDataRooms: tenants.reduce((sum: number, t: { _count?: { dataRooms: number } }) => 
            sum + (t._count?.dataRooms || 0), 0),
          totalStorageUsedMb: tenants.reduce((sum: number, t: { storageUsedMb?: number }) => 
            sum + (t.storageUsedMb || 0), 0),
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <p className="text-slate-400">
          Overview of system metrics and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-slate-400">
              <span className="text-green-400">{stats?.activeTenants || 0} active</span>
              {" / "}
              <span className="text-yellow-400">
                {(stats?.totalTenants || 0) - (stats?.activeTenants || 0)} inactive
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-slate-400">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Active Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalPlans || 0}</div>
            <p className="text-xs text-slate-400">
              Pricing plans configured
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Data Rooms</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalDataRooms || 0}</div>
            <p className="text-xs text-slate-400">
              Total VDRs created
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {((stats?.totalStorageUsedMb || 0) / 1024).toFixed(2)} GB
            </div>
            <p className="text-xs text-slate-400">
              Total storage consumed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Avg Users/Tenant</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.totalTenants 
                ? ((stats.totalUsers || 0) / stats.totalTenants).toFixed(1) 
                : "0"}
            </div>
            <p className="text-xs text-slate-400">
              Average users per tenant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a 
              href="/admin/tenants" 
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-white">Manage Tenants</p>
                <p className="text-sm text-slate-400">View and edit organizations</p>
              </div>
            </a>
            <a 
              href="/admin/plans" 
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-white">Manage Plans</p>
                <p className="text-sm text-slate-400">Configure pricing tiers</p>
              </div>
            </a>
            <a 
              href="/admin/tenants?action=create" 
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-white">Add New Tenant</p>
                <p className="text-sm text-slate-400">Create a new organization</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
