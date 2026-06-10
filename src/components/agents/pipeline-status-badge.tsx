import { Badge } from "@/components/ui/badge";
import type { BriefStatus, PipelineStatus } from "@/lib/types";

const pipelineMap: Record<
  PipelineStatus,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  pending_review: { label: "Pending Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  needs_rewrite: { label: "Needs Rewrite", variant: "muted" },
};

const briefMap: Record<
  BriefStatus,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  running: { label: "Running", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  const { label, variant } = pipelineMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function BriefStatusBadge({ status }: { status: BriefStatus }) {
  const { label, variant } = briefMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}
