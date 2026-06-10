"use client";

import { motion } from "framer-motion";
import type { GardenZone } from "@/lib/hq/hq-world-layout";
import { DEPARTMENT_BUILDINGS, type BuildingStyle } from "@/lib/hq/department-buildings";

function BuildingArt({ style, accent }: { style: BuildingStyle; accent: string }) {
  const stroke = accent;
  const fill = `${accent}22`;

  switch (style) {
    case "manor":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <path d="M8 48 L40 12 L72 48 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="28" y="36" width="24" height="16" rx="2" fill="white" stroke={stroke} strokeWidth="1.2" />
          <circle cx="40" cy="22" r="4" fill={stroke} opacity="0.5" />
          <path d="M36 12 L40 6 L44 12" stroke={stroke} strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "tower":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <rect x="30" y="20" width="20" height="32" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="26" y="14" width="28" height="8" rx="2" fill="white" stroke={stroke} strokeWidth="1.2" />
          <circle cx="40" cy="10" r="5" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="45" y1="10" x2="52" y2="6" stroke={stroke} strokeWidth="1.2" />
          <rect x="36" y="30" width="8" height="6" fill="white" stroke={stroke} strokeWidth="0.8" />
        </svg>
      );
    case "greenhouse":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <path d="M10 48 Q40 8 70 48" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="40" y1="20" x2="40" y2="48" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
          <line x1="22" y1="38" x2="58" y2="38" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
          <circle cx="58" cy="42" r="6" fill="#f472b6" opacity="0.4" stroke={stroke} strokeWidth="0.8" />
        </svg>
      );
    case "observatory":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <rect x="24" y="32" width="32" height="18" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="40" cy="28" rx="22" ry="12" fill="white" stroke={stroke} strokeWidth="1.5" />
          <line x1="40" y1="16" x2="52" y2="8" stroke={stroke} strokeWidth="1.2" />
          <circle cx="52" cy="8" r="3" fill={stroke} opacity="0.4" />
        </svg>
      );
    case "cafe":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <rect x="14" y="28" width="52" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M10 28 Q40 14 70 28" fill="white" stroke={stroke} strokeWidth="1.2" />
          <rect x="34" y="36" width="12" height="14" fill="white" stroke={stroke} strokeWidth="1" />
          <circle cx="22" cy="38" r="3" fill="#fde68a" opacity="0.7" />
        </svg>
      );
    case "gate":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <path d="M12 48 L12 24 Q40 8 68 24 L68 48" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="34" y="32" width="12" height="16" fill="white" stroke={stroke} strokeWidth="1.2" />
          <rect x="6" y="44" width="68" height="6" rx="1" fill={stroke} opacity="0.2" />
          <circle cx="20" cy="46" r="3" fill={stroke} opacity="0.5" />
          <circle cx="60" cy="46" r="3" fill={stroke} opacity="0.5" />
        </svg>
      );
    case "grove":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <rect x="8" y="38" width="4" height="12" fill="#92400e" />
          <circle cx="10" cy="34" r="10" fill="#2d6a4f" opacity="0.45" />
          <rect x="48" y="30" width="22" height="20" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="54" y="36" width="8" height="8" fill="white" stroke={stroke} strokeWidth="0.8" />
          <path d="M62 30 L66 22 L70 30" fill="#fbbf24" opacity="0.5" stroke={stroke} strokeWidth="0.8" />
        </svg>
      );
    case "pond":
      return (
        <svg viewBox="0 0 80 56" className="h-14 w-20 sm:h-16 sm:w-24" aria-hidden>
          <ellipse cx="40" cy="42" rx="30" ry="10" fill="#7dd3fc" opacity="0.35" stroke={stroke} strokeWidth="1.2" />
          <path d="M20 42 Q30 38 40 42 Q50 46 60 42" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
          <circle cx="40" cy="28" r="8" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M36 24 Q40 18 44 24" fill="#f9a8d4" opacity="0.5" />
        </svg>
      );
  }
}

export function HQDepartmentBuilding({
  zone,
  agentCount,
  isHighlighted,
}: {
  zone: GardenZone;
  agentCount: number;
  isHighlighted?: boolean;
}) {
  const building = DEPARTMENT_BUILDINGS[zone.id];

  return (
    <motion.div
      className="pointer-events-none absolute z-[2] flex flex-col items-center justify-end"
      style={{
        left: `${zone.center.x - zone.width / 2}%`,
        top: `${zone.center.y - zone.height / 2}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
      }}
      animate={isHighlighted ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 2, repeat: isHighlighted ? Infinity : 0 }}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 px-1 py-2 text-center shadow-sm backdrop-blur-[2px] transition-shadow"
        style={{
          borderColor: `${zone.accent}${isHighlighted ? "88" : "33"}`,
          backgroundColor: `${zone.color}aa`,
          boxShadow: isHighlighted ? `0 0 24px ${zone.accent}33` : undefined,
        }}
      >
        <BuildingArt style={building.style} accent={zone.accent} />
        <p className="font-heading text-[9px] font-bold leading-tight sm:text-[10px]" style={{ color: zone.accent }}>
          {building.tagline}
        </p>
        <p className="text-[7px] text-brand-muted sm:text-[8px]">{zone.subtitle}</p>
        {agentCount > 0 && (
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-1 rounded-full px-1.5 py-0.5 text-[7px] font-semibold text-white sm:text-[8px]"
            style={{ backgroundColor: zone.accent }}
          >
            {agentCount} here
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
