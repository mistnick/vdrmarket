"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CreateDataRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateDataRoomDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateDataRoomDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        isPublic: false,
        requirePassword: false,
        password: "",
    });

    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        password?: string;
    }>({});

    const validateStep1 = () => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Data room name is required";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        if (formData.description && formData.description.length > 1000) {
            newErrors.description = "Description must be less than 1000 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: typeof errors = {};

        if (formData.requirePassword && !formData.password) {
            newErrors.password = "Password is required when password protection is enabled";
        } else if (formData.requirePassword && formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleSubmit = async () => {
        if (!validateStep2()) {
            return;
        }

        try {
            setLoading(true);

            const response = await fetch("/api/datarooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    isPublic: formData.isPublic,
                    password: formData.requirePassword ? formData.password : undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create data room");
            }

            toast.success("Data room created successfully");

            // Reset form
            setFormData({
                name: "",
                description: "",
                isPublic: false,
                requirePassword: false,
                password: "",
            });
            setErrors({});
            setCurrentStep(1);

            // Close dialog
            onOpenChange(false);

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }

            // Navigate to the new data room
            router.push(`/datarooms/${result.data.id}`);
            router.refresh();
        } catch (error) {
            console.error("Error creating data room:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create data room"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!loading) {
            if (!newOpen) {
                setFormData({
                    name: "",
                    description: "",
                    isPublic: false,
                    requirePassword: false,
                    password: "",
                });
                setErrors({});
                setCurrentStep(1);
            }
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent size="md">
                <DialogHeader>
                    <DialogTitle>Create New Data Room</DialogTitle>
                    <DialogDescription>
                        Step {currentStep} of 2: {currentStep === 1 ? "Basic Information" : "Access Settings"}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="flex gap-2 mb-4">
                    <div
                        className={`flex-1 h-1.5 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-muted"
                            }`}
                    />
                    <div
                        className={`flex-1 h-1.5 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-muted"
                            }`}
                    />
                </div>

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Data Room Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Q4 2024 Investor Documents"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Add a description for this data room..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className={errors.description ? "border-destructive" : ""}
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {formData.description.length}/1000 characters
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 2: Access Settings */}
                {currentStep === 2 && (
                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Public Access</Label>
                                <p className="text-sm text-muted-foreground">
                                    Anyone with the link can access this data room
                                </p>
                            </div>
                            <Switch
                                checked={formData.isPublic}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isPublic: checked })
                                }
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Password Protection</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require a password to access
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.requirePassword}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, requirePassword: checked })
                                    }
                                />
                            </div>

                            {formData.requirePassword && (
                                <div className="grid gap-2 pl-4 border-l-2">
                                    <Label htmlFor="password">
                                        Password <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        className={errors.password ? "border-destructive" : ""}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-info mb-1">Ready to create</p>
                                    <p className="text-info/80">
                                        Your data room will be created with {formData.isPublic ? "public" : "private"} access
                                        {formData.requirePassword && " and password protection"}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {currentStep === 1 ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleNext}>
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                            <Button type="button" onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Data Room
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
