import { Badge } from "@/components/ui/badge";
import type { BriefStatus, PipelineStatus } from "@/lib/types";

type BadgeMeta = { label: string; variant: "success" | "warning" | "danger" | "muted" };

const pipelineMap: Record<PipelineStatus, BadgeMeta> = {
  pending_review: { label: "Pending Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  needs_rewrite: { label: "Needs Rewrite", variant: "muted" },
};

const briefMap: Record<BriefStatus, BadgeMeta> = {
  generated: { label: "Generated", variant: "success" },
  running: { label: "Running", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  archived: { label: "Archived", variant: "muted" },
};

// DB statuses are not guaranteed to match the TS unions — never crash on unknowns.
function fallbackMeta(status: string | null | undefined): BadgeMeta {
  return { label: status ? String(status) : "Unknown", variant: "muted" };
}

export function PipelineStatusBadge({ status }: { status: PipelineStatus | string | null }) {
  const { label, variant } =
    (status ? pipelineMap[status as PipelineStatus] : undefined) ?? fallbackMeta(status);
  return <Badge variant={variant}>{label}</Badge>;
}

export function BriefStatusBadge({ status }: { status: BriefStatus | string | null }) {
  const { label, variant } =
    (status ? briefMap[status as BriefStatus] : undefined) ?? fallbackMeta(status);
  return <Badge variant={variant}>{label}</Badge>;
}
