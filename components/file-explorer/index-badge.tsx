"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface IndexBadgeProps {
    index: string | null | undefined;
    size?: "sm" | "md";
    className?: string;
}

/**
 * A small badge displaying the hierarchical index
 * Used in the sidebar folder tree
 */
export function IndexBadge({ index, size = "sm", className }: IndexBadgeProps) {
    if (!index) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn(
                            "font-mono text-muted-foreground bg-muted/50 rounded px-1",
                            size === "sm" && "text-[10px]",
                            size === "md" && "text-xs",
                            className
                        )}
                    >
                        {index}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Index: {index}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
