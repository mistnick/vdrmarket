"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  CreditCard, 
  Plus, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Check,
  Infinity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  description: string | null;
  maxVdr: number;
  maxAdminUsers: number;
  maxStorageMb: number;
  durationDays: number | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  features: string[];
  isActive: boolean;
  _count?: { tenants: number };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  maxVdr: string;
  maxVdrUnlimited: boolean;
  maxAdminUsers: string;
  maxAdminUsersUnlimited: boolean;
  maxStorageMb: string;
  maxStorageUnlimited: boolean;
  durationDays: string;
  durationUnlimited: boolean;
  priceMonthly: string;
  priceYearly: string;
  features: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: "",
  description: "",
  maxVdr: "5",
  maxVdrUnlimited: false,
  maxAdminUsers: "2",
  maxAdminUsersUnlimited: false,
  maxStorageMb: "1024",
  maxStorageUnlimited: false,
  durationDays: "365",
  durationUnlimited: false,
  priceMonthly: "",
  priceYearly: "",
  features: "",
  isActive: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans", {
        credentials: "include"
      });
      const data = await res.json();
      setPlans(data.data || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const planToFormData = (plan: Plan): FormData => ({
    name: plan.name,
    description: plan.description || "",
    maxVdr: plan.maxVdr === -1 ? "" : String(plan.maxVdr),
    maxVdrUnlimited: plan.maxVdr === -1,
    maxAdminUsers: plan.maxAdminUsers === -1 ? "" : String(plan.maxAdminUsers),
    maxAdminUsersUnlimited: plan.maxAdminUsers === -1,
    maxStorageMb: plan.maxStorageMb === -1 ? "" : String(plan.maxStorageMb),
    maxStorageUnlimited: plan.maxStorageMb === -1,
    durationDays: plan.durationDays === null ? "" : String(plan.durationDays),
    durationUnlimited: plan.durationDays === null,
    priceMonthly: plan.priceMonthly ? String(plan.priceMonthly) : "",
    priceYearly: plan.priceYearly ? String(plan.priceYearly) : "",
    features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
    isActive: plan.isActive,
  });

  const formDataToPayload = (data: FormData) => ({
    name: data.name,
    description: data.description || null,
    maxVdr: data.maxVdrUnlimited ? -1 : parseInt(data.maxVdr) || 1,
    maxAdminUsers: data.maxAdminUsersUnlimited ? -1 : parseInt(data.maxAdminUsers) || 1,
    maxStorageMb: data.maxStorageUnlimited ? -1 : parseInt(data.maxStorageMb) || 1024,
    durationDays: data.durationUnlimited ? null : parseInt(data.durationDays) || 365,
    priceMonthly: data.priceMonthly ? parseFloat(data.priceMonthly) : null,
    priceYearly: data.priceYearly ? parseFloat(data.priceYearly) : null,
    features: data.features.split("\n").filter(f => f.trim()),
    isActive: data.isActive,
  });

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData(planToFormData(plan));
    setEditDialogOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (plan: Plan) => {
    setSelectedPlan(plan);
    setStatusDialogOpen(true);
  };

  const handleCreatePlan = async () => {
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formDataToPayload(formData)),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create plan");
      }

      setCreateDialogOpen(false);
      setFormData(initialFormData);
      fetchPlans();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formDataToPayload(formData)),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update plan");
      }

      setEditDialogOpen(false);
      fetchPlans();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete plan");
      }

      setDeleteDialogOpen(false);
      fetchPlans();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedPlan) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !selectedPlan.isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update plan status");
      }

      setStatusDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error updating plan status:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const formatLimit = (value: number, suffix: string = "") => {
    if (value === -1) return <span className="flex items-center gap-1"><Infinity className="h-4 w-4" /> Unlimited</span>;
    return `${value}${suffix}`;
  };

  const formatStorage = (mb: number) => {
    if (mb === -1) return <span className="flex items-center gap-1"><Infinity className="h-4 w-4" /> Unlimited</span>;
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
    return `${mb} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const PlanForm = () => (
    <div className="space-y-4">
      {formError && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {formError}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Plan Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Professional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Plan description for customers"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxVdr">Max Data Rooms</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxVdrUnlimited" className="text-xs text-muted-foreground">Unlimited</Label>
              <Switch
                id="maxVdrUnlimited"
                checked={formData.maxVdrUnlimited}
                onCheckedChange={(checked) => setFormData({ ...formData, maxVdrUnlimited: checked })}
              />
            </div>
          </div>
          <Input
            id="maxVdr"
            type="number"
            value={formData.maxVdr}
            onChange={(e) => setFormData({ ...formData, maxVdr: e.target.value })}
            disabled={formData.maxVdrUnlimited}
            placeholder="10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxAdminUsers">Max Admin Users</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxAdminUsersUnlimited" className="text-xs text-muted-foreground">Unlimited</Label>
              <Switch
                id="maxAdminUsersUnlimited"
                checked={formData.maxAdminUsersUnlimited}
                onCheckedChange={(checked) => setFormData({ ...formData, maxAdminUsersUnlimited: checked })}
              />
            </div>
          </div>
          <Input
            id="maxAdminUsers"
            type="number"
            value={formData.maxAdminUsers}
            onChange={(e) => setFormData({ ...formData, maxAdminUsers: e.target.value })}
            disabled={formData.maxAdminUsersUnlimited}
            placeholder="5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxStorageMb">Storage (MB)</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxStorageUnlimited" className="text-xs text-muted-foreground">Unlimited</Label>
              <Switch
                id="maxStorageUnlimited"
                checked={formData.maxStorageUnlimited}
                onCheckedChange={(checked) => setFormData({ ...formData, maxStorageUnlimited: checked })}
              />
            </div>
          </div>
          <Input
            id="maxStorageMb"
            type="number"
            value={formData.maxStorageMb}
            onChange={(e) => setFormData({ ...formData, maxStorageMb: e.target.value })}
            disabled={formData.maxStorageUnlimited}
            placeholder="10240"
          />
          <p className="text-xs text-muted-foreground">
            1024 MB = 1 GB
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="durationDays">Duration (Days)</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="durationUnlimited" className="text-xs text-muted-foreground">No expiry</Label>
              <Switch
                id="durationUnlimited"
                checked={formData.durationUnlimited}
                onCheckedChange={(checked) => setFormData({ ...formData, durationUnlimited: checked })}
              />
            </div>
          </div>
          <Input
            id="durationDays"
            type="number"
            value={formData.durationDays}
            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
            disabled={formData.durationUnlimited}
            placeholder="365"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceMonthly">Monthly Price (€)</Label>
          <Input
            id="priceMonthly"
            type="number"
            step="0.01"
            value={formData.priceMonthly}
            onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
            placeholder="99.99"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceYearly">Yearly Price (€)</Label>
          <Input
            id="priceYearly"
            type="number"
            step="0.01"
            value={formData.priceYearly}
            onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value })}
            placeholder="999.99"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Unlimited users&#10;Priority support&#10;API access"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Plan is active and available for selection</Label>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Plans</h1>
          <p className="text-slate-400">
            Manage pricing plans and feature limits
          </p>
        </div>
        <Button onClick={() => {
          setFormData(initialFormData);
          setCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`bg-slate-800 border-slate-700 ${!plan.isActive ? "opacity-60" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  {plan.name}
                  {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                      {plan.isActive ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Suspend Plan
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activate Plan
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeletePlan(plan)}
                      className="text-destructive"
                      disabled={(plan._count?.tenants || 0) > 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {plan.description && (
                <CardDescription className="text-slate-400">{plan.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pricing */}
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  {plan.priceMonthly ? (
                    <div>
                      <span className="text-3xl font-bold text-white">€{plan.priceMonthly}</span>
                      <span className="text-slate-400">/month</span>
                      {plan.priceYearly && (
                        <p className="text-sm text-slate-400 mt-1">
                          or €{plan.priceYearly}/year
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-lg font-medium text-slate-400">Custom pricing</span>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data Rooms:</span>
                    <span className="font-medium text-white">{formatLimit(plan.maxVdr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admin Users:</span>
                    <span className="font-medium text-white">{formatLimit(plan.maxAdminUsers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage:</span>
                    <span className="font-medium text-white">{formatStorage(plan.maxStorageMb)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-medium text-white">
                      {plan.durationDays ? `${plan.durationDays} days` : "No expiry"}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-sm font-medium mb-2 text-slate-300">Features:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="h-4 w-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="border-t border-slate-700 pt-4 text-center">
                  <p className="text-sm text-slate-400">
                    <span className="font-medium text-white">{plan._count?.tenants || 0}</span> tenants using this plan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-white">No plans yet</h3>
            <p className="text-slate-400 mb-4">
              Create your first pricing plan to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Define a new pricing plan with limits and features
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={formLoading || !formData.name}>
              {formLoading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan details and limits
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={formLoading}>
              {formLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {(selectedPlan?._count?.tenants || 0) > 0 ? (
                <span className="text-destructive">
                  Cannot delete this plan. {selectedPlan?._count?.tenants} tenant(s) are currently using it.
                  Please reassign them to another plan first.
                </span>
              ) : (
                `This will permanently delete the "${selectedPlan?.name}" plan. This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={(selectedPlan?._count?.tenants || 0) > 0}
            >
              {formLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedPlan?.isActive ? "Suspend" : "Activate"} Plan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPlan?.isActive 
                ? `This will suspend the "${selectedPlan?.name}" plan. New tenants will not be able to select it.`
                : `This will activate the "${selectedPlan?.name}" plan. Tenants will be able to select it.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusChange}
              className={selectedPlan?.isActive ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {formLoading ? "Processing..." : selectedPlan?.isActive ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
