"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Calendar as CalendarIcon, FileType, Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface SearchFilters {
    fileType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
}

interface SearchFiltersProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    availableTags?: string[];
}

const FILE_TYPES = [
    { value: "pdf", label: "PDF" },
    { value: "doc", label: "Word" },
    { value: "xls", label: "Excel" },
    { value: "ppt", label: "PowerPoint" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "text", label: "Text" },
];

export function SearchFiltersComponent({
    filters,
    onFiltersChange,
    availableTags = [],
}: SearchFiltersProps) {
    const hasActiveFilters =
        filters.fileType || filters.dateFrom || filters.dateTo || (filters.tags?.length ?? 0) > 0;

    const clearFilters = () => {
        onFiltersChange({});
    };

    const removeFilter = (key: keyof SearchFilters) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const removeTag = (tag: string) => {
        const newTags = filters.tags?.filter((t) => t !== tag) ?? [];
        onFiltersChange({
            ...filters,
            tags: newTags.length > 0 ? newTags : undefined,
        });
    };

    return (
        <div className="space-y-2">
            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* File Type Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <FileType className="h-3 w-3 mr-1" />
                            File Type
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select file type</p>
                            <Select
                                value={filters.fileType}
                                onValueChange={(value) =>
                                    onFiltersChange({ ...filters, fileType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FILE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Date From Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Date From
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select start date</p>
                            <Input
                                type="date"
                                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ""}
                                onChange={(e) =>
                                    onFiltersChange({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })
                                }
                            />
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Date To Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Date To
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select end date</p>
                            <Input
                                type="date"
                                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ""}
                                onChange={(e) =>
                                    onFiltersChange({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : undefined })
                                }
                            />
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Tags Filter (if tags available) */}
                {availableTags.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Tag className="h-3 w-3 mr-1" />
                                Tags
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Select tags</p>
                                <div className="flex flex-wrap gap-1">
                                    {availableTags.map((tag) => {
                                        const isSelected = filters.tags?.includes(tag);
                                        return (
                                            <Badge
                                                key={tag}
                                                variant={isSelected ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    const currentTags = filters.tags ?? [];
                                                    const newTags = isSelected
                                                        ? currentTags.filter((t) => t !== tag)
                                                        : [...currentTags, tag];
                                                    onFiltersChange({
                                                        ...filters,
                                                        tags: newTags.length > 0 ? newTags : undefined,
                                                    });
                                                }}
                                            >
                                                {tag}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Clear All */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive"
                        onClick={clearFilters}
                    >
                        Clear all
                    </Button>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.fileType && (
                        <Badge variant="secondary" className="gap-1">
                            Type: {FILE_TYPES.find((t) => t.value === filters.fileType)?.label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeFilter("fileType")}
                            />
                        </Badge>
                    )}
                    {filters.dateFrom && (
                        <Badge variant="secondary" className="gap-1">
                            From: {format(filters.dateFrom, "MMM dd, yyyy")}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeFilter("dateFrom")}
                            />
                        </Badge>
                    )}
                    {filters.dateTo && (
                        <Badge variant="secondary" className="gap-1">
                            To: {format(filters.dateTo, "MMM dd, yyyy")}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeFilter("dateTo")}
                            />
                        </Badge>
                    )}
                    {filters.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                            />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
