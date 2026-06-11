"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyOsPulse } from "@/components/hq/living/use-company-os-pulse";
import type { ActivityItem } from "@/lib/hq/types";

/**
 * Phase 34 — HQ Pulse. Collapsed by default; tap the header to expand.
 * Shows company-OS vitals plus the latest items that need a decision.
 */
export function HQPulsePanel({
  activity,
  onSelectActivity,
  onApproveActivity,
  onRejectActivity,
  defaultOpen = false,
}: {
  activity: ActivityItem[];
  onSelectActivity: (id: string) => void;
  onApproveActivity?: (id: string) => void;
  onRejectActivity?: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pulse = useCompanyOsPulse();

  const safeActivity = Array.isArray(activity) ? activity.filter((a) => a && a.id) : [];
  const pending = safeActivity.filter((a) => a.status === "pending");
  const urgent = pending.filter((a) => a.priority === "high").length;
  const recent = safeActivity.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border/60 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-brand-primary">
          <Activity className="h-4 w-4 text-brand-accent" />
          HQ Pulse
        </span>
        <span className="flex items-center gap-2">
          {urgent > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {urgent} urgent
            </span>
          )}
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {pending.length} pending
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-brand-muted transition", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="border-t border-brand-border/40 px-4 pb-4">
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <PulseTile label="Blocked" value={pulse?.blockedWorkflows ?? 0} danger={(pulse?.blockedWorkflows ?? 0) > 0} />
            <Link href="/calendar?status=ready_to_publish" className="contents">
              <PulseTile label="Ready" value={pulse?.readyToPublish ?? 0} />
            </Link>
            <Link href="/approvals?status=pending" className="contents">
              <PulseTile label="Pending" value={pending.length} danger={urgent > 0} />
            </Link>
          </div>

          <ul className="mt-3 space-y-1.5">
            {recent.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-brand-border/40 bg-brand-bg/40 px-2.5 py-2"
              >
                <button
                  type="button"
                  onClick={() => onSelectActivity(item.id)}
                  className="block w-full text-left"
                >
                  <p className="line-clamp-2 text-[11px] font-medium leading-snug text-brand-primary">
                    {item.title}
                  </p>
                </button>
                {item.status === "pending" && (onApproveActivity || onRejectActivity) && (
                  <div className="mt-1.5 flex gap-1.5">
                    {onApproveActivity && (
                      <button
                        type="button"
                        onClick={() => onApproveActivity(item.id)}
                        className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    )}
                    {onRejectActivity && (
                      <button
                        type="button"
                        onClick={() => onRejectActivity(item.id)}
                        className="flex items-center gap-1 rounded-full border border-brand-border px-2 py-0.5 text-[10px] font-semibold text-brand-muted"
                      >
                        <X className="h-3 w-3" /> Pass
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
            {recent.length === 0 && (
              <li className="rounded-xl border border-dashed border-brand-border px-2.5 py-3 text-center text-[11px] text-brand-muted">
                No activity yet today.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function PulseTile({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-2 py-2",
        danger ? "border-red-200 bg-red-50" : "border-brand-border/50 bg-brand-bg/50"
      )}
    >
      <p className={cn("text-base font-bold", danger ? "text-red-700" : "text-brand-primary")}>{value}</p>
      <p className="text-[9px] font-medium uppercase tracking-wide text-brand-muted">{label}</p>
    </div>
  );
}
