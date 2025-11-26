import { ReactNode } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 border-b border-border/60 mb-6", className)}>
      {breadcrumbs && (
        <Breadcrumbs items={breadcrumbs} className="mb-1" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
