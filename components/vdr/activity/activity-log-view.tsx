"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityLog {
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    metadata: any;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface ActivityLogViewProps {
    activities: ActivityLog[];
    scope: "self" | "group" | "all";
    onScopeChange: (scope: "self" | "group" | "all") => void;
    onFilterChange: (filters: {
        startDate?: Date;
        endDate?: Date;
        action?: string;
        resourceType?: string;
    }) => void;
    onExport: () => void;
    canViewAll: boolean;
    canViewGroup: boolean;
}

const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-800",
    update: "bg-blue-100 text-blue-800",
    delete: "bg-red-100 text-red-800",
    view: "bg-gray-100 text-gray-800",
    download: "bg-purple-100 text-purple-800",
    upload: "bg-yellow-100 text-yellow-800",
};

export function ActivityLogView({
    activities,
    scope,
    onScopeChange,
    onFilterChange,
    onExport,
    canViewAll,
    canViewGroup,
}: ActivityLogViewProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [actionFilter, setActionFilter] = useState<string>();
    const [resourceTypeFilter, setResourceTypeFilter] = useState<string>();

    const applyFilters = () => {
        onFilterChange({
            startDate,
            endDate,
            action: actionFilter,
            resourceType: resourceTypeFilter,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Activity Log</h2>
                    <p className="text-muted-foreground">
                        View activity logs based on your permissions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                    <Button variant="outline" onClick={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Scope selector */}
            <div className="flex gap-2">
                <Button
                    variant={scope === "self" ? "default" : "outline"}
                    onClick={() => onScopeChange("self")}
                >
                    My Activity
                </Button>
                {canViewGroup && (
                    <Button
                        variant={scope === "group" ? "default" : "outline"}
                        onClick={() => onScopeChange("group")}
                    >
                        Group Activity
                    </Button>
                )}
                {canViewAll && (
                    <Button
                        variant={scope === "all" ? "default" : "outline"}
                        onClick={() => onScopeChange("all")}
                    >
                        All Activity
                    </Button>
                )}
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All actions</SelectItem>
                                        <SelectItem value="create">Create</SelectItem>
                                        <SelectItem value="update">Update</SelectItem>
                                        <SelectItem value="delete">Delete</SelectItem>
                                        <SelectItem value="view">View</SelectItem>
                                        <SelectItem value="download">Download</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Resource Type</Label>
                                <Select
                                    value={resourceTypeFilter}
                                    onValueChange={setResourceTypeFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                        <SelectItem value="folder">Folder</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="group">Group</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={applyFilters}>Apply Filters</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activity list */}
            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y">
                            {activities.map((activity) => (
                                <div key={activity.id} className="p-4 hover:bg-muted/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={
                                                        actionColors[activity.action.toLowerCase()] ||
                                                        "bg-gray-100 text-gray-800"
                                                    }
                                                    variant="secondary"
                                                >
                                                    {activity.action}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {activity.resourceType}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                by {activity.user.name || activity.user.email}
                                            </p>
                                            {activity.metadata && (
                                                <pre className="mt-2 text-xs text-muted-foreground">
                                                    {JSON.stringify(activity.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(activity.createdAt), "MMM d, yyyy HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {activities.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-lg font-medium">No activity found</p>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your filters
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
