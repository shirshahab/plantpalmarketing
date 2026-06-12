"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/hq/types";

export type VillageStatus =
  | "researching"
  | "drafting"
  | "reviewing"
  | "approving"
  | "publishing"
  | "waiting"
  | "blocked"
  | "finished"
  | "idle";

const STATUS_MAP: Record<AgentStatus, VillageStatus> = {
  researching: "researching",
  writing: "drafting",
  reviewing: "reviewing",
  waiting_for_approval: "waiting",
  approved: "finished",
  needs_attention: "blocked",
  paused: "idle",
};

const LABELS: Record<VillageStatus, string> = {
  researching: "Researching",
  drafting: "Drafting",
  reviewing: "Reviewing",
  approving: "Approving",
  publishing: "Publishing",
  waiting: "Waiting",
  blocked: "Blocked",
  finished: "Finished",
  idle: "Idle",
};

const COLORS: Record<VillageStatus, string> = {
  researching: "bg-sky-100 text-sky-800 border-sky-200",
  drafting: "bg-pink-100 text-pink-800 border-pink-200",
  reviewing: "bg-violet-100 text-violet-800 border-violet-200",
  approving: "bg-amber-100 text-amber-900 border-amber-200",
  publishing: "bg-lime-100 text-lime-800 border-lime-200",
  waiting: "bg-amber-50 text-amber-800 border-amber-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
  finished: "bg-emerald-100 text-emerald-800 border-emerald-200",
  idle: "bg-white/90 text-brand-muted border-brand-border/60",
};

export function agentStatusToVillage(status: AgentStatus): VillageStatus {
  return STATUS_MAP[status] ?? "idle";
}

export function HQStatusPill({
  status,
  label,
  pulse = false,
}: {
  status: VillageStatus;
  label?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shadow-sm",
        COLORS[status],
        pulse && "animate-pulse"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "blocked" ? "bg-rose-500" : status === "waiting" ? "bg-amber-500" : "bg-emerald-500"
        )}
      />
      {label ?? LABELS[status]}
    </span>
  );
}
