import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm",
  secondary:
    "bg-white text-brand-primary border border-brand-border hover:bg-brand-bg shadow-sm",
  ghost: "text-brand-muted hover:text-brand-primary hover:bg-brand-primary/5",
  danger: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100",
  success: "bg-brand-accent/15 text-brand-primary border border-brand-accent/30 hover:bg-brand-accent/25",
};

export function Button({
  children,
  variant = "primary",
  className,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
