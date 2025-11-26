"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Search,
    Filter,
    X,
    Plus,
    File,
    Calendar,
    Tag,
    Database,
    Loader2,
} from "lucide-react";

interface SearchFilter {
    id: string;
    type: "metadata" | "tag" | "fileType" | "dateRange";
    field?: string;
    value: string;
    operator?: "equals" | "contains" | "greaterThan" | "lessThan";
}

interface AdvancedSearchProps {
    teamId: string;
    onSearch: (query: string, filters: SearchFilter[]) => void;
}

const FILE_TYPES = [
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word" },
    { value: "xlsx", label: "Excel" },
    { value: "pptx", label: "PowerPoint" },
    { value: "image", label: "Images" },
];

export function AdvancedSearch({ teamId, onSearch }: AdvancedSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<SearchFilter[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const addFilter = (type: SearchFilter["type"]) => {
        const newFilter: SearchFilter = {
            id: Date.now().toString(),
            type,
            value: "",
            operator: "equals",
        };
        setFilters([...filters, newFilter]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter((f) => f.id !== id));
    };

    const updateFilter = (
        id: string,
        updates: Partial<SearchFilter>
    ) => {
        setFilters(
            filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
    };

    const handleSearch = () => {
        onSearch(searchQuery, filters);
    };

    const clearFilters = () => {
        setFilters([]);
        setSearchQuery("");
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {filters.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {filters.length}
                        </Badge>
                    )}
                </Button>
                <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.map((filter) => (
                        <Badge
                            key={filter.id}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 flex items-center gap-1"
                        >
                            {filter.type === "metadata" && <Database className="h-3 w-3" />}
                            {filter.type === "tag" && <Tag className="h-3 w-3" />}
                            {filter.type === "fileType" && <File className="h-3 w-3" />}
                            {filter.type === "dateRange" && <Calendar className="h-3 w-3" />}
                            <span className="text-xs">
                                {filter.field ? `${filter.field}: ` : ""}
                                {filter.value}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => removeFilter(filter.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 px-2"
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* Filter Builder */}
            {showFilters && (
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Filter Documents</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Filter List */}
                    <div className="space-y-3">
                        {filters.map((filter) => (
                            <div
                                key={filter.id}
                                className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg"
                            >
                                <div className="col-span-3">
                                    <Label className="text-xs mb-1">Type</Label>
                                    <Select
                                        value={filter.type}
                                        onValueChange={(value) =>
                                            updateFilter(filter.id, {
                                                type: value as SearchFilter["type"],
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="metadata">Metadata</SelectItem>
                                            <SelectItem value="tag">Tag</SelectItem>
                                            <SelectItem value="fileType">File Type</SelectItem>
                                            <SelectItem value="dateRange">Date Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filter.type === "metadata" && (
                                    <>
                                        <div className="col-span-3">
                                            <Label className="text-xs mb-1">Field</Label>
                                            <Input
                                                value={filter.field || ""}
                                                onChange={(e) =>
                                                    updateFilter(filter.id, { field: e.target.value })
                                                }
                                                placeholder="Field name"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs mb-1">Operator</Label>
                                            <Select
                                                value={filter.operator}
                                                onValueChange={(value) =>
                                                    updateFilter(filter.id, {
                                                        operator: value as SearchFilter["operator"],
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="equals">Equals</SelectItem>
                                                    <SelectItem value="contains">Contains</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                <div className={filter.type === "metadata" ? "col-span-3" : "col-span-8"}>
                                    <Label className="text-xs mb-1">Value</Label>
                                    {filter.type === "fileType" ? (
                                        <Select
                                            value={filter.value}
                                            onValueChange={(value) =>
                                                updateFilter(filter.id, { value })
                                            }
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FILE_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={filter.type === "dateRange" ? "date" : "text"}
                                            value={filter.value}
                                            onChange={(e) =>
                                                updateFilter(filter.id, { value: e.target.value })
                                            }
                                            placeholder="Enter value..."
                                            className="h-9"
                                        />
                                    )}
                                </div>

                                <div className="col-span-1 flex items-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFilter(filter.id)}
                                        className="h-9 w-9 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFilter("metadata")}
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Metadata
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFilter("tag")}
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Tag
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFilter("fileType")}
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            File Type
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFilter("dateRange")}
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Date Range
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
