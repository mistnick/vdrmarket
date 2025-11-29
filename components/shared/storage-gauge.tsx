"use client";

import { useTenantUsage } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StorageGaugeProps {
  size?: number;
  className?: string;
}

export function StorageGauge({ size = 40, className }: StorageGaugeProps) {
  const { usage, isLoading } = useTenantUsage();

  if (isLoading || !usage) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { storage } = usage;
  
  // Se unlimited, mostra un indicatore speciale
  if (storage.unlimited) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-primary/10",
                className
              )}
              style={{ width: size, height: size }}
            >
              <span className="text-xs font-medium text-primary">∞</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm font-medium">Storage Illimitato</p>
            <p className="text-xs text-muted-foreground">
              Utilizzato: {storage.usedFormatted}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const percentage = Math.min(storage.percentage, 100);
  
  // Calcola il colore in base alla percentuale
  const getColor = (pct: number) => {
    if (pct >= 90) return "hsl(0, 84%, 60%)"; // Rosso
    if (pct >= 75) return "hsl(38, 92%, 50%)"; // Arancione
    return "hsl(142, 76%, 36%)"; // Verde
  };

  const color = getColor(percentage);
  
  // Parametri del SVG
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Rotazione per iniziare dal basso a sinistra (-135°) e finire in basso a destra (135°)
  // Usando 270° di arco (3/4 del cerchio)
  const arcPercentage = 0.75; // 270° / 360°
  const arcCircumference = circumference * arcPercentage;
  const arcOffset = arcCircumference - (percentage / 100) * arcCircumference;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex items-center justify-center cursor-pointer",
              className
            )}
            style={{ width: size, height: size }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-[135deg]"
            >
              {/* Background arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcCircumference} ${circumference}`}
                className="text-muted/30"
              />
              {/* Foreground arc (progress) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcCircumference} ${circumference}`}
                strokeDashoffset={arcOffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-semibold"
                style={{
                  fontSize: size * 0.22,
                  color: color,
                }}
              >
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="text-sm font-medium">Quota Storage</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Utilizzato:</span>
              <span>{storage.usedFormatted}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Limite:</span>
              <span>{storage.limitFormatted}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Occupazione:</span>
              <span style={{ color }}>{Math.round(percentage)}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
