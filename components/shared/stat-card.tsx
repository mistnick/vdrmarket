import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  label,
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const displayTitle = title || label;
  const isPositive = trend?.positive ?? trend?.isPositive;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 sm:p-6',
        'hover:border-emerald-200 hover:shadow-sm transition-all',
        'min-h-[120px] flex flex-col',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 sm:space-y-2 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {displayTitle}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs sm:text-sm font-medium',
                isPositive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-50">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
}
