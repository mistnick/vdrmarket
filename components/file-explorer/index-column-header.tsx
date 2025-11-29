"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IndexSortDirection } from "@/types/index-types";

interface IndexColumnHeaderProps {
    sortDirection: IndexSortDirection;
    onSort: () => void;
    className?: string;
}

export function IndexColumnHeader({
    sortDirection,
    onSort,
    className,
}: IndexColumnHeaderProps) {
    return (
        <button
            onClick={onSort}
            className={cn(
                "flex items-center gap-1 hover:bg-muted/50 px-2 py-1 rounded transition-colors",
                "text-left font-medium text-sm",
                className
            )}
            aria-label={`Sort by index ${
                sortDirection === "asc"
                    ? "(currently ascending)"
                    : sortDirection === "desc"
                    ? "(currently descending)"
                    : ""
            }`}
        >
            <span>Index</span>
            {sortDirection === null && (
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            )}
            {sortDirection === "asc" && <ArrowUp className="h-4 w-4" />}
            {sortDirection === "desc" && <ArrowDown className="h-4 w-4" />}
        </button>
    );
}
