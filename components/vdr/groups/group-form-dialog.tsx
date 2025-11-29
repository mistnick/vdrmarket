"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupType } from "@prisma/client";

const groupFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.enum(["ADMINISTRATOR", "USER", "CUSTOM"]),
    canViewDueDiligenceChecklist: z.boolean(),
    canManageDocumentPermissions: z.boolean(),
    canViewGroupUsers: z.boolean(),
    canManageUsers: z.boolean(),
    canViewGroupActivity: z.boolean(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GroupFormValues) => Promise<void>;
    initialData?: Partial<GroupFormValues>;
    mode: "create" | "edit";
}

export function GroupFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    mode,
}: GroupFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            type: "USER",
            canViewDueDiligenceChecklist: false,
            canManageDocumentPermissions: false,
            canViewGroupUsers: false,
            canManageUsers: false,
            canViewGroupActivity: false,
        },
    });

    const selectedType = form.watch("type");

    const handleSubmit = async (values: GroupFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Group" : "Edit Group"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Create a new group with specific permissions"
                            : "Update group settings and permissions"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Group name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Group description (optional)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Type</FormLabel>
                                    <Select
                                        disabled={mode === "edit"}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select group type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMINISTRATOR">
                                                Administrator
                                            </SelectItem>
                                            <SelectItem value="USER">User</SelectItem>
                                            <SelectItem value="CUSTOM">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {selectedType === "ADMINISTRATOR" &&
                                            "Full access to all features"}
                                        {selectedType === "USER" &&
                                            "Standard access with configurable permissions"}
                                        {selectedType === "CUSTOM" &&
                                            "Fully customizable permissions"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedType !== "ADMINISTRATOR" && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <h4 className="font-medium">Permissions</h4>

                                <FormField
                                    control={form.control}
                                    name="canViewDueDiligenceChecklist"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>View Due Diligence Checklist</FormLabel>
                                                <FormDescription>
                                                    Allow viewing of due diligence checklists
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {selectedType === "USER" && (
                                    <FormField
                                        control={form.control}
                                        name="canViewGroupUsers"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>View Group Users</FormLabel>
                                                    <FormDescription>
                                                        Allow viewing users in the same group
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedType === "CUSTOM" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="canManageDocumentPermissions"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Manage Document Permissions</FormLabel>
                                                        <FormDescription>
                                                            Allow managing permissions on documents and folders
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="canManageUsers"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Manage Users</FormLabel>
                                                        <FormDescription>
                                                            Allow managing users within own group
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                <FormField
                                    control={form.control}
                                    name="canViewGroupActivity"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>View Group Activity</FormLabel>
                                                <FormDescription>
                                                    Allow viewing activity logs for the group
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Saving..."
                                    : mode === "create"
                                        ? "Create Group"
                                        : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
