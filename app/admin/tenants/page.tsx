"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Building2, 
  Plus, 
  MoreHorizontal,
  Search,
  Eye,
  UserCog,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  X,
  Check,
  Mail,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Plan {
  id: string;
  name: string;
  maxVdr: number;
  maxAdminUsers: number;
  maxStorageMb: number;
}

interface TenantUser {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  logo: string | null;
  website: string | null;
  storageUsedMb: number;
  plan?: Plan;
  planId: string | null;
  tenantUsers?: TenantUser[];
  _count?: { tenantUsers: number; dataRooms: number };
  createdAt: string;
  updatedAt: string;
}

export default function TenantsPage() {
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialogs state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newUserCredentials, setNewUserCredentials] = useState<{ email: string; password: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    planId: "",
    adminEmail: "",
    adminName: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        fetch("/api/admin/tenants"),
        fetch("/api/admin/plans"),
      ]);

      const tenantsData = await tenantsRes.json();
      const plansData = await plansRes.json();

      setTenants(tenantsData.data || []);
      setPlans(plansData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open create dialog if query param is set
  useEffect(() => {
    if (searchParams?.get("action") === "create") {
      setCreateDialogOpen(true);
    }
  }, [searchParams]);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleViewTenant = async (tenant: Tenant) => {
    // Fetch full tenant details
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        credentials: "include"
      });
      const data = await res.json();
      setSelectedTenant(data.data || tenant);
      setViewDialogOpen(true);
    } catch {
      setSelectedTenant(tenant);
      setViewDialogOpen(true);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description || "",
      planId: tenant.planId || "",
      adminEmail: "",
      adminName: "",
    });
    setEditDialogOpen(true);
  };

  const handleManageAdmin = async (tenant: Tenant) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/users`, {
        credentials: "include"
      });
      const data = await res.json();
      setSelectedTenant({ ...tenant, tenantUsers: data.data || [] });
      setAdminDialogOpen(true);
    } catch {
      setSelectedTenant(tenant);
      setAdminDialogOpen(true);
    }
  };

  const handleSyncAdmins = async (tenant: Tenant) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/sync-admins`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Sync completed: ${data.message}`);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to sync admins: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleToggleStatus = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setStatusDialogOpen(true);
  };

  const handleCreateTenant = async () => {
    setFormLoading(true);
    setFormError(null);

    try {
      // Create tenant
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          planId: formData.planId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create tenant");
      }

      const newTenant = data.data;

      // If admin email provided, create admin user
      if (formData.adminEmail) {
        const adminRes = await fetch(`/api/admin/tenants/${newTenant.id}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.adminEmail,
            name: formData.adminName,
            role: "TENANT_ADMIN",
          }),
        });
        
        const adminData = await adminRes.json();
        
        // If a new user was created with generated password, show credentials dialog
        if (adminData.data?.isNewUser && adminData.data?.generatedPassword) {
          setNewUserCredentials({
            email: formData.adminEmail,
            password: adminData.data.generatedPassword,
          });
          setCredentialsDialogOpen(true);
        }
      }

      setCreateDialogOpen(false);
      setFormData({ name: "", slug: "", description: "", planId: "", adminEmail: "", adminName: "" });
      fetchData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;
    
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          planId: formData.planId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update tenant");
      }

      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedTenant) return;

    setFormLoading(true);
    try {
      const newStatus = selectedTenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setStatusDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInviteAdmin = async () => {
    if (!selectedTenant || !formData.adminEmail) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.adminEmail,
          name: formData.adminName,
          role: "TENANT_ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite admin");
      }

      // If a new user was created with generated password, show credentials dialog
      if (data.data.isNewUser && data.data.generatedPassword) {
        setNewUserCredentials({
          email: formData.adminEmail,
          password: data.data.generatedPassword,
        });
        setCredentialsDialogOpen(true);
      }

      // Refresh admin list
      const usersRes = await fetch(`/api/admin/tenants/${selectedTenant.id}/users`, {
        credentials: "include"
      });
      const usersData = await usersRes.json();
      setSelectedTenant({ ...selectedTenant, tenantUsers: usersData.data || [] });
      setFormData({ ...formData, adminEmail: "", adminName: "" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!selectedTenant) return;

    try {
      await fetch(`/api/admin/tenants/${selectedTenant.id}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Refresh admin list
      const usersRes = await fetch(`/api/admin/tenants/${selectedTenant.id}/users`, {
        credentials: "include"
      });
      const usersData = await usersRes.json();
      setSelectedTenant({ ...selectedTenant, tenantUsers: usersData.data || [] });
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tenants</h1>
          <p className="text-slate-400">
            Manage organizations and their administrators
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300">Tenant</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Plan</TableHead>
                <TableHead className="text-slate-300">Users</TableHead>
                <TableHead className="text-slate-300">VDRs</TableHead>
                <TableHead className="text-slate-300">Storage</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="text-sm text-slate-400">{tenant.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="text-slate-300">{tenant.plan?.name || "—"}</TableCell>
                    <TableCell className="text-slate-300">{tenant._count?.tenantUsers || 0}</TableCell>
                    <TableCell className="text-slate-300">{tenant._count?.dataRooms || 0}</TableCell>
                    <TableCell className="text-slate-300">{(tenant.storageUsedMb / 1024).toFixed(2)} GB</TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTenant(tenant)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageAdmin(tenant)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Manage Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSyncAdmins(tenant)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Admin Groups
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
                            {tenant.status === "ACTIVE" ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Suspend Tenant
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate Tenant
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about this tenant
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedTenant.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Slug</Label>
                  <p className="font-medium">{selectedTenant.slug}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedTenant.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <p className="font-medium">{selectedTenant.plan?.name || "No plan"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Users</Label>
                  <p className="font-medium">{selectedTenant._count?.tenantUsers || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data Rooms</Label>
                  <p className="font-medium">{selectedTenant._count?.dataRooms || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Storage Used</Label>
                  <p className="font-medium">{(selectedTenant.storageUsedMb / 1024).toFixed(2)} GB</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(selectedTenant.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedTenant.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedTenant.description}</p>
                </div>
              )}
              {selectedTenant.tenantUsers && selectedTenant.tenantUsers.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Administrators</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTenant.tenantUsers
                      .filter(tu => tu.role === "TENANT_ADMIN")
                      .map((tu) => (
                        <div key={tu.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{tu.role}</Badge>
                          <span>{tu.user.name || tu.user.email}</span>
                          <span className="text-muted-foreground">({tu.user.email})</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedTenant) handleEditTenant(selectedTenant);
            }}>
              Edit Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="acme-corporation"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the organization"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData({ ...formData, planId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.maxVdr === -1 ? "∞" : plan.maxVdr} VDRs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Invite Admin (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                An invitation will be sent to this email with admin access
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTenant} disabled={formLoading || !formData.name}>
              {formLoading ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plan</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData({ ...formData, planId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTenant} disabled={formLoading}>
              {formLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Admin Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Administrators</DialogTitle>
            <DialogDescription>
              {selectedTenant?.name} - Manage tenant administrators
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {formError}
              </div>
            )}
            
            {/* Current Admins */}
            <div>
              <Label className="text-muted-foreground">Current Administrators</Label>
              <div className="mt-2 space-y-2">
                {selectedTenant?.tenantUsers?.filter(tu => tu.role === "TENANT_ADMIN").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No administrators assigned</p>
                ) : (
                  selectedTenant?.tenantUsers
                    ?.filter(tu => tu.role === "TENANT_ADMIN")
                    .map((tu) => (
                      <div key={tu.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{tu.user.name || tu.user.email}</p>
                          <p className="text-sm text-muted-foreground">{tu.user.email}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveAdmin(tu.userId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Invite New Admin */}
            <div className="border-t pt-4">
              <Label className="text-muted-foreground">Invite New Administrator</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                />
                <Input
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Name (optional)"
                />
              </div>
              <Button 
                className="mt-2 w-full" 
                variant="outline"
                onClick={handleInviteAdmin}
                disabled={formLoading || !formData.adminEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                {formLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTenant?.status === "ACTIVE" ? "Suspend" : "Activate"} Tenant?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTenant?.status === "ACTIVE" 
                ? `This will suspend "${selectedTenant?.name}". Users will no longer be able to access this tenant's resources.`
                : `This will activate "${selectedTenant?.name}". Users will be able to access this tenant's resources again.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusChange}
              className={selectedTenant?.status === "ACTIVE" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {formLoading ? "Processing..." : selectedTenant?.status === "ACTIVE" ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New User Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Admin User Created
            </DialogTitle>
            <DialogDescription>
              A new admin user has been created. Please save these credentials securely.
            </DialogDescription>
          </DialogHeader>
          {newUserCredentials && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono text-sm font-medium">{newUserCredentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <p className="font-mono text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                    {newUserCredentials.password}
                  </p>
                </div>
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                  This password will not be shown again. The user should change it after first login.
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (newUserCredentials) {
                  navigator.clipboard.writeText(
                    `Email: ${newUserCredentials.email}\nPassword: ${newUserCredentials.password}`
                  );
                }
              }}
            >
              Copy Credentials
            </Button>
            <Button onClick={() => {
              setCredentialsDialogOpen(false);
              setNewUserCredentials(null);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
