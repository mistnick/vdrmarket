"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground", className)}>
            <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
            </Link>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-foreground transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-semibold">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
