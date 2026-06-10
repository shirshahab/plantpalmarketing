import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-brand-muted">
      {children}
    </label>
  );
}
