import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-bg/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-brand-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-brand-muted">{description}</p>
    </div>
  );
}
