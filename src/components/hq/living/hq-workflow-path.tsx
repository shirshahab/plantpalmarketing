"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { ActiveWorkflowVisual } from "@/lib/hq/activity-to-choreography";

export function HQWorkflowPath({ workflow }: { workflow: ActiveWorkflowVisual | null }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !workflow) return;
    const path = svgRef.current.querySelector(".hq-active-workflow-path");
    const dot = svgRef.current.querySelector(".hq-active-workflow-dot");
    if (!path) return;
    gsap.fromTo(
      path,
      { strokeDashoffset: 120, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 0.9, ease: "power2.out" }
    );
    if (dot) {
      gsap.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" });
    }
  }, [workflow]);

  if (!workflow) return null;

  const { from, to, pathLabel } = workflow;
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 5;
  const sameSpot = from.x === to.x && from.y === to.y;

  if (sameSpot) return null;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id="hq-glow">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="hq-active-workflow-path"
        d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
        fill="none"
        stroke="#d97706"
        strokeWidth="0.85"
        strokeDasharray="3 1.5"
        filter="url(#hq-glow)"
        opacity="0.9"
      />
      <circle className="hq-active-workflow-dot" cx={from.x} cy={from.y} r="1" fill="#2d6a4f" opacity="0.9" />
      <circle cx={to.x} cy={to.y} r="1.2" fill="#d97706" opacity="0.95">
        <animate attributeName="r" values="0.9;1.4;0.9" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <g transform={`translate(${midX}, ${midY - 2})`}>
        <rect x="-12" y="-2.5" width="24" height="5" rx="2.5" fill="white" opacity="0.92" />
        <text
          x="0"
          y="0.8"
          textAnchor="middle"
          fontSize="2.2"
          fill="#92400e"
          fontWeight="600"
        >
          {pathLabel}
        </text>
      </g>
    </svg>
  );
}
