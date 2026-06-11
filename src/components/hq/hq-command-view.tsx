"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyOsPulse } from "@/components/hq/living/use-company-os-pulse";
import type { ActivityItem, AgentId, HQAgent, HQCharacter } from "@/lib/hq/types";

const CHARACTER_ICON: Record<HQCharacter, string> = {
  scout: "🔭",
  writer: "✍️",
  director: "🎬",
  listener: "👂",
  roots: "🌱",
  scout_explorer: "🧭",
  scout_creator: "🔭",
  watchtower: "🗼",
  sentinel: "📡",
  bloom: "🌸",
  sage: "🪴",
  sprout: "🚀",
  oak: "🌳",
  ivy: "🌿",
  atlas: "🗺️",
  fern: "🎨",
  echo: "📣",
  gatekeeper: "🛡️",
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  researching: { label: "Researching", tone: "bg-sky-100 text-sky-700" },
  writing: { label: "Writing", tone: "bg-emerald-100 text-emerald-700" },
  reviewing: { label: "Reviewing", tone: "bg-violet-100 text-violet-700" },
  waiting_for_approval: { label: "Needs you", tone: "bg-amber-100 text-amber-700" },
  approved: { label: "On track", tone: "bg-lime-100 text-lime-700" },
  needs_attention: { label: "Attention", tone: "bg-red-100 text-red-700" },
  paused: { label: "Paused", tone: "bg-gray-100 text-gray-600" },
};

const DEFAULT_STATUS = { label: "Working", tone: "bg-brand-bg text-brand-muted" };

/**
 * Phase 33 — mobile "HQ Command View".
 * A clean, card-based summary of the living world: status card, 2-column
 * agent grid, live workflow strip, founder actions, and an optional mini
 * entry point back into the full Living World.
 */
export function HQCommandView({
  agents,
  activity,
  onSelectAgent,
  onSelectActivity,
  onOpenLivingWorld,
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  onSelectAgent: (id: AgentId) => void;
  onSelectActivity: (id: string) => void;
  onOpenLivingWorld: () => void;
}) {
  const pulse = useCompanyOsPulse();
  const [showMiniMap, setShowMiniMap] = useState(false);

  const safeAgents = Array.isArray(agents) ? agents.filter((a) => a && a.id) : [];
  const safeActivity = Array.isArray(activity) ? activity.filter((a) => a && a.id) : [];

  const activeAgents = safeAgents.filter((a) => a.status !== "paused").length;
  const approvalsNeeded = safeActivity.filter((a) => a.status === "pending").length;
  const urgent = safeActivity.filter((a) => a.priority === "high" && a.status === "pending").length;
  const workflowStrip = safeActivity.slice(0, 5);
  const founderItems = safeActivity.filter((a) => a.status === "pending").slice(0, 4);

  const healthScore = pulse
    ? Math.max(20, 100 - pulse.blockedWorkflows * 12 - urgent * 6)
    : Math.max(20, 100 - urgent * 6);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Top status card */}
      <div className="rounded-2xl border border-brand-border/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-primary">PlantPal HQ</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold",
              healthScore >= 75
                ? "bg-lime-100 text-lime-700"
                : healthScore >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            Health {healthScore}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <StatusTile label="Agents active" value={activeAgents} />
          <Link href="/approvals?status=pending" className="contents">
            <StatusTile label="Approvals needed" value={approvalsNeeded} highlight={approvalsNeeded > 0} />
          </Link>
          <Link href="/calendar?status=ready_to_publish" className="contents">
            <StatusTile label="Ready to publish" value={pulse?.readyToPublish ?? 0} />
          </Link>
          <StatusTile label="Urgent alerts" value={urgent} highlight={urgent > 0} danger />
        </div>
      </div>

      {/* 2. Agent grid */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">Team</p>
        <div className="grid grid-cols-2 gap-2">
          {safeAgents.map((agent) => {
            const meta = STATUS_LABEL[agent.status] ?? DEFAULT_STATUS;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelectAgent(agent.id)}
                className="rounded-2xl border border-brand-border/60 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{CHARACTER_ICON[agent.character] ?? "🌿"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-primary">{agent.name}</p>
                    <p className="truncate text-[10px] text-brand-muted">{agent.role}</p>
                  </div>
                </div>
                <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", meta.tone)}>
                  {meta.label}
                </span>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-brand-muted">
                  {agent.currentTask || "Standing by"}
                </p>
                <p className="mt-1 text-[10px] font-medium text-brand-primary/70">
                  {agent.itemsCreated} today
                </p>
              </button>
            );
          })}
          {safeAgents.length === 0 && (
            <p className="col-span-2 rounded-2xl border border-dashed border-brand-border bg-white p-4 text-center text-xs text-brand-muted">
              No pulse data yet. Agents will report here after their next run.
            </p>
          )}
        </div>
      </div>

      {/* 3. Live workflow strip */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">Live workflows</p>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {workflowStrip.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectActivity(item.id)}
              className="min-w-[220px] max-w-[240px] shrink-0 snap-start rounded-2xl border border-brand-border/60 bg-white p-3 text-left shadow-sm active:scale-[0.98]"
            >
              <p className="line-clamp-2 text-xs font-medium leading-snug text-brand-primary">
                {item.title || "Agent activity"}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] text-brand-muted">{item.summary}</p>
              {item.status === "pending" && (
                <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Needs review
                </span>
              )}
            </button>
          ))}
          {workflowStrip.length === 0 && (
            <p className="w-full rounded-2xl border border-dashed border-brand-border bg-white p-4 text-center text-xs text-brand-muted">
              No workflow handoffs yet today.
            </p>
          )}
        </div>
      </div>

      {/* 4. Founder action section */}
      <div className="rounded-2xl border border-brand-border/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Founder actions</p>
          <Link href="/founder" className="text-[11px] font-medium text-brand-accent">
            Founder Mode →
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-brand-border/40">
          {founderItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectActivity(item.id)}
                className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
              >
                <span className="line-clamp-2 text-xs text-brand-primary">{item.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
              </button>
            </li>
          ))}
          {founderItems.length === 0 && (
            <li className="py-2.5 text-xs text-brand-muted">Nothing waiting on you. Nice.</li>
          )}
        </ul>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link
            href="/approvals"
            className="rounded-xl bg-brand-primary px-3 py-2.5 text-center text-xs font-semibold text-white"
          >
            Approvals
          </Link>
          <Link
            href="/calendar?status=ready_to_publish"
            className="rounded-xl border border-brand-border px-3 py-2.5 text-center text-xs font-semibold text-brand-primary"
          >
            Ready to publish
          </Link>
        </div>
      </div>

      {/* 5. Optional mini-map / living world entry */}
      <div className="rounded-2xl border border-brand-border/60 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setShowMiniMap((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
            <MapIcon className="h-4 w-4 text-brand-accent" />
            Living World
          </span>
          <ChevronDown className={cn("h-4 w-4 text-brand-muted transition", showMiniMap && "rotate-180")} />
        </button>
        {showMiniMap && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-brand-muted">
              The full animated HQ with every agent, station, and workflow path. Best on a bigger screen,
              but it works here too.
            </p>
            <button
              type="button"
              onClick={onOpenLivingWorld}
              className="w-full rounded-xl bg-brand-accent px-3 py-2.5 text-xs font-semibold text-white"
            >
              Open Living World
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-2 py-2.5",
        highlight
          ? danger
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
          : "border-brand-border/50 bg-brand-bg/50"
      )}
    >
      <p className={cn("text-lg font-bold", highlight ? (danger ? "text-red-700" : "text-amber-700") : "text-brand-primary")}>
        {value}
      </p>
      <p className="text-[10px] font-medium text-brand-muted">{label}</p>
    </div>
  );
}
