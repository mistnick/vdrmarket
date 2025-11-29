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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const inviteUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    groupIds: z.array(z.string()).min(1, "Select at least one group"),
    accessType: z.enum(["UNLIMITED", "LIMITED"]),
    accessStartAt: z.date().optional(),
    accessEndAt: z.date().optional(),
    require2FA: z.boolean(),
    allowedIps: z.string().optional(),
}).refine((data) => {
    if (data.accessType === "LIMITED" && !data.accessStartAt) {
        return false;
    }
    return true;
}, {
    message: "Start date is required for limited access",
    path: ["accessStartAt"],
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: InviteUserFormValues) => Promise<void>;
    groups: Array<{ id: string; name: string; type: string }>;
}

export function InviteUserDialog({
    open,
    onOpenChange,
    onSubmit,
    groups,
}: InviteUserDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<InviteUserFormValues>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            email: "",
            groupIds: [],
            accessType: "UNLIMITED",
            require2FA: false,
            allowedIps: "",
        },
    });

    const accessType = form.watch("accessType");

    const handleSubmit = async (values: InviteUserFormValues) => {
        setIsSubmitting(true);
        try {
            // Parse IPs if provided
            const processedValues = {
                ...values,
                allowedIps: values.allowedIps
                    ? values.allowedIps.split(",").map((ip) => ip.trim()).filter(Boolean)
                    : undefined,
            };
            await onSubmit(processedValues as any);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Error inviting user:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                    <DialogDescription>
                        Send an invitation to join this data room
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="user@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="groupIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Groups</FormLabel>
                                    <div className="space-y-2">
                                        {groups.map((group) => (
                                            <div key={group.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={field.value.includes(group.id)}
                                                    onCheckedChange={(checked) => {
                                                        const newValue = checked
                                                            ? [...field.value, group.id]
                                                            : field.value.filter((id) => id !== group.id);
                                                        field.onChange(newValue);
                                                    }}
                                                />
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {group.name} ({group.type})
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <FormDescription>
                                        Select which groups this user will belong to
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="accessType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Access Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                                            <SelectItem value="LIMITED">Limited (Time-based)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {accessType === "LIMITED" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="accessStartAt"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="accessEndAt"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date (Optional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="require2FA"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Require Two-Factor Authentication</FormLabel>
                                        <FormDescription>
                                            User must set up 2FA before accessing the data room
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allowedIps"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Allowed IP Addresses (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="192.168.1.1, 10.0.0.0/24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Comma-separated list of allowed IPs or CIDR ranges
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Invitation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
