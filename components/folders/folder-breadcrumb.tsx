import { Slash } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    id: string;
    name: string;
    href: string;
}

interface FolderBreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function FolderBreadcrumb({ items, className }: FolderBreadcrumbProps) {
    if (items.length === 0) return null;

    return (
        <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
            <Link
                href="/dashboard/folders"
                className="hover:text-foreground transition-colors font-medium"
            >
                All Folders
            </Link>

            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <div key={item.id} className="flex items-center space-x-1">
                        <Slash className="h-4 w-4 rotate-12" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{item.name}</span>
                        ) : (
                            <Link
                                href={item.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.name}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
