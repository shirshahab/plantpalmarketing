"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";
import { slugToHqId } from "@/lib/agents/agent-slugs";
import { AGENT_WORLD_POSITIONS } from "@/lib/hq/hq-world-layout";

const PRIORITY_COLORS: Record<CollaborationPriority, string> = {
  urgent: "#dc2626",
  high: "#d97706",
  medium: "#0369a1",
  low: "#6b9b7a",
};

export function HQInteractionPaths({
  messageLines,
  activeWalk,
}: {
  messageLines: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  activeWalk?: { from: AgentSlug; to: AgentSlug } | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll(".hq-flow-path");
    gsap.fromTo(
      paths,
      { strokeDashoffset: 100, opacity: 0 },
      { strokeDashoffset: 0, opacity: 0.7, duration: 1.2, stagger: 0.15, ease: "power2.out" }
    );
  }, [messageLines, activeWalk]);

  const lines = [...messageLines];
  if (activeWalk) {
    lines.unshift({ from: activeWalk.from, to: activeWalk.to, priority: "high", id: "active-walk" });
  }

  const seen = new Set<string>();
  const unique = lines.filter((l) => {
    const key = `${l.from}-${l.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {unique.map((line) => {
        const fromPos = AGENT_WORLD_POSITIONS[slugToHqId(line.from)]?.home;
        const toPos = AGENT_WORLD_POSITIONS[slugToHqId(line.to)]?.home;
        if (!fromPos || !toPos) return null;

        const color = PRIORITY_COLORS[line.priority];
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = Math.min(fromPos.y, toPos.y) - 4;

        return (
          <g key={line.id}>
            <path
              className="hq-flow-path"
              d={`M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              strokeDasharray="2 1"
              opacity="0.6"
            />
            <circle cx={toPos.x} cy={toPos.y} r="0.6" fill={color} className="hq-flow-path">
              <animate attributeName="r" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
