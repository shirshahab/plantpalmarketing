import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const statusMap: Record<Status, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  approved: { label: "Approved", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Rejected", variant: "danger" },
  draft: { label: "Draft", variant: "muted" },
};

export function StatusBadge({ status }: { status: Status | string | null }) {
  // DB statuses are not guaranteed to match the TS union — never crash on unknowns.
  const { label, variant } = (status ? statusMap[status as Status] : undefined) ?? {
    label: status ? String(status) : "Unknown",
    variant: "muted" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}
