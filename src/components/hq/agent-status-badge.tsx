import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/hq/types";
import { STATUS_LABELS } from "@/lib/hq/mock-data";

const statusStyles: Record<AgentStatus, string> = {
  researching: "bg-sky-50 text-sky-700 border-sky-200",
  writing: "bg-amber-50 text-amber-800 border-amber-200",
  reviewing: "bg-violet-50 text-violet-700 border-violet-200",
  waiting_for_approval: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needs_attention: "bg-rose-50 text-rose-700 border-rose-200",
  paused: "bg-gray-50 text-gray-600 border-gray-200",
};

const statusDots: Record<AgentStatus, string> = {
  researching: "bg-sky-400",
  writing: "bg-amber-400",
  reviewing: "bg-violet-400",
  waiting_for_approval: "bg-orange-400",
  approved: "bg-emerald-400",
  needs_attention: "bg-rose-400 animate-pulse",
  paused: "bg-gray-400",
};

export function AgentStatusBadge({
  status,
  size = "sm",
}: {
  status: AgentStatus;
  size?: "sm" | "xs";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        statusStyles[status],
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDots[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
