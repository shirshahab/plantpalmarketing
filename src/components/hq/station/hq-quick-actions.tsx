"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  Crown,
  Rocket,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyReportGenerateButton } from "@/components/daily-report/daily-report-generate-button";
import type { ActivityItem } from "@/lib/hq/types";

/**
 * Phase 34 — compact founder quick actions for the HQ command center.
 */
export function HQQuickActions({
  activity,
  onDailyReportGenerated,
}: {
  activity: ActivityItem[];
  onDailyReportGenerated?: () => void;
}) {
  const pending = (Array.isArray(activity) ? activity : []).filter(
    (a) => a && a.status === "pending"
  ).length;

  const actions = [
    {
      href: "/approvals?status=pending",
      label: "Approvals",
      icon: CheckSquare,
      badge: pending > 0 ? String(pending) : undefined,
      highlight: pending > 0,
    },
    { href: "/calendar?status=ready_to_publish", label: "Ready to publish", icon: Rocket },
    { href: "/founder", label: "Founder Mode", icon: Crown },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/company-os", label: "Company OS", icon: Workflow },
    { href: "/automation", label: "Automation", icon: Zap },
  ];

  return (
    <div className="rounded-2xl border border-brand-border/60 bg-white p-3 shadow-sm">
      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
        Quick actions
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition hover:border-brand-accent/50 hover:bg-brand-bg/60",
              action.highlight
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-brand-border/50 text-brand-primary"
            )}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
            <span className="truncate">{action.label}</span>
            {action.badge && (
              <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-px text-[9px] font-bold text-white">
                {action.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="mt-2 border-t border-brand-border/40 pt-2 [&_button]:w-full [&_button]:justify-center">
        <DailyReportGenerateButton onGenerated={onDailyReportGenerated} />
      </div>
    </div>
  );
}
