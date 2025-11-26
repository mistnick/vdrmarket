import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-gray-50 p-6 mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-8">{description}</p>
      {action && (
        action.href ? (
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button
            onClick={action.onClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
