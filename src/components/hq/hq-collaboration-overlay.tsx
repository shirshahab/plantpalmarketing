"use client";

import type { AgentId } from "@/lib/hq/types";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";
import { slugToHqId } from "@/lib/agents/agent-slugs";

/** Relative positions (%) for message line endpoints in HQ workspace */
const AGENT_POSITIONS: Record<AgentId, { x: number; y: number }> = {
  chief_of_staff: { x: 50, y: 16 },
  publishing: { x: 17, y: 40 },
  content: { x: 50, y: 40 },
  creative_director: { x: 83, y: 40 },
  community: { x: 17, y: 56 },
  approval: { x: 50, y: 56 },
  creator: { x: 83, y: 56 },
  competitor: { x: 17, y: 72 },
  partnerships: { x: 50, y: 72 },
  growth: { x: 83, y: 72 },
  acquisition: { x: 33, y: 86 },
  customer_voice: { x: 67, y: 86 },
};

const PRIORITY_COLORS: Record<CollaborationPriority, string> = {
  urgent: "#dc2626",
  high: "#d97706",
  medium: "#0369a1",
  low: "#6b9b7a",
};

export function HQCollaborationOverlay({
  messageLines,
}: {
  messageLines: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
}) {
  if (messageLines.length === 0) return null;

  const seen = new Set<string>();
  const uniqueLines = messageLines.filter((line) => {
    const key = `${line.from}-${line.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {uniqueLines.map((line) => {
        const fromId = slugToHqId(line.from);
        const toId = slugToHqId(line.to);
        const from = AGENT_POSITIONS[fromId];
        const to = AGENT_POSITIONS[toId];
        if (!from || !to) return null;

        const color = PRIORITY_COLORS[line.priority];
        const midX = (from.x + to.x) / 2;
        const midY = Math.min(from.y, to.y) - 6;

        return (
          <g key={line.id} filter="url(#glow)">
            <path
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke={color}
              strokeWidth="0.35"
              strokeDasharray={line.priority === "urgent" ? "1.5 0.8" : "none"}
              opacity="0.65"
            />
            <circle cx={to.x} cy={to.y} r="0.8" fill={color} opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}
