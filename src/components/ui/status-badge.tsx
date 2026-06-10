import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const statusMap: Record<Status, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  approved: { label: "Approved", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Rejected", variant: "danger" },
  draft: { label: "Draft", variant: "muted" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, variant } = statusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}
