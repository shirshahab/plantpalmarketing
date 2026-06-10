import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-muted">{label}</p>
          <p className="font-heading mt-1 text-3xl font-bold text-brand-primary">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-brand-accent">{trend}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
