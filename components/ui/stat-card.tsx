

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: string;
        positive?: boolean;
    };
    className?: string;
}

export function StatCard({
    label,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-lg border border-border p-6',
                'hover:border-primary/20 transition-colors',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                    {trend && (
                        <p
                            className={cn(
                                'text-sm font-medium',
                                trend.positive ? 'text-primary' : 'text-destructive'
                            )}
                        >
                            {trend.value}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                )}
            </div>
        </div>
    );
}
