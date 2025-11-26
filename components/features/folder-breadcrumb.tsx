'use client';

import Link from 'next/link';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

type BreadcrumbItem = {
    id?: string;
    name: string;
    href?: string;
};

type FolderBreadcrumbProps = {
    items: BreadcrumbItem[];
    className?: string;
};

export function FolderBreadcrumb({ items, className }: FolderBreadcrumbProps) {
    return (
        <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
            <Link
                href="/folders"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4 mr-1" />
                <span>All Folders</span>
            </Link>

            {items.length > 0 && <ChevronRight className="h-4 w-4" />}

            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <div key={item.id || index} className="flex items-center">
                        {item.href && !isLast ? (
                            <>
                                <Link
                                    href={item.href}
                                    className="flex items-center hover:text-foreground transition-colors"
                                >
                                    <Folder className="h-4 w-4 mr-1" />
                                    <span>{item.name}</span>
                                </Link>
                                <ChevronRight className="h-4 w-4 mx-1" />
                            </>
                        ) : (
                            <div className="flex items-center text-foreground font-medium">
                                <Folder className="h-4 w-4 mr-1" />
                                <span>{item.name}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

/**
 * Parse folder path into breadcrumb items
 * Example: "/projects/2024/q1" -> [{ name: "projects" }, { name: "2024" }, { name: "q1" }]
 */
export function parseFolderPath(path: string, folderIds?: string[]): BreadcrumbItem[] {
    const parts = path.split('/').filter(Boolean);

    return parts.map((name, index) => ({
        id: folderIds?.[index],
        name,
        href: folderIds?.[index] ? `/folders/${folderIds[index]}` : undefined,
    }));
}
