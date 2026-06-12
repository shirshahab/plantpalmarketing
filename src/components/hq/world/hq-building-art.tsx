"use client";

import type { BuildingArtStyle } from "@/lib/hq/hq-village-layout";

/** Pixel-art inspired building silhouettes — Stardew / Pokémon interior vibe. */
export function HQBuildingArt({ style, accent }: { style: BuildingArtStyle; accent: string }) {
  const s = accent;
  const fill = `${accent}33`;

  switch (style) {
    case "plaza":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="8" y="40" width="80" height="28" rx="2" fill="#e9d5ff" stroke={s} strokeWidth="2" />
          <path d="M4 40 L48 8 L92 40 Z" fill={fill} stroke={s} strokeWidth="2" />
          <rect x="38" y="48" width="20" height="20" fill="#fff" stroke={s} strokeWidth="1.5" />
          <circle cx="48" cy="28" r="6" fill="#fbbf24" stroke={s} strokeWidth="1" />
          <rect x="20" y="50" width="10" height="10" fill="#fff" stroke={s} strokeWidth="1" opacity="0.8" />
          <rect x="66" y="50" width="10" height="10" fill="#fff" stroke={s} strokeWidth="1" opacity="0.8" />
        </svg>
      );
    case "cabin":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <path d="M8 52 L48 16 L88 52 Z" fill="#fde68a" stroke="#92400e" strokeWidth="2" />
          <rect x="20" y="44" width="56" height="24" rx="2" fill={fill} stroke={s} strokeWidth="2" />
          <rect x="40" y="52" width="16" height="16" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          <rect x="24" y="48" width="12" height="10" fill="#bae6fd" stroke={s} strokeWidth="1" />
        </svg>
      );
    case "cafe":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="12" y="36" width="72" height="32" rx="3" fill="#d1fae5" stroke={s} strokeWidth="2" />
          <path d="M8 36 Q48 18 88 36" fill="#fff" stroke={s} strokeWidth="2" />
          <rect x="38" y="48" width="20" height="20" fill="#fff" stroke={s} strokeWidth="1.5" />
          <circle cx="26" cy="46" r="5" fill="#fde68a" />
          <path d="M72 44 Q78 40 80 46" stroke={s} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "tower":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="36" y="28" width="24" height="40" rx="2" fill="#cbd5e1" stroke={s} strokeWidth="2" />
          <rect x="30" y="20" width="36" height="10" rx="2" fill="#fff" stroke={s} strokeWidth="1.5" />
          <circle cx="48" cy="12" r="8" fill="none" stroke={s} strokeWidth="2" />
          <line x1="54" y1="12" x2="64" y2="6" stroke={s} strokeWidth="2" />
          <rect x="42" y="38" width="12" height="10" fill="#67e8f9" opacity="0.6" stroke={s} strokeWidth="1" />
        </svg>
      );
    case "studio":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="14" y="32" width="68" height="36" rx="2" fill="#fce7f3" stroke={s} strokeWidth="2" />
          <rect x="22" y="40" width="20" height="16" fill="#fff" stroke={s} strokeWidth="1" />
          <circle cx="62" cy="48" r="10" fill="#f9a8d4" stroke={s} strokeWidth="1.5" />
          <path d="M58 48 L62 44 L66 48 L62 52 Z" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "hut":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <path d="M12 48 L48 20 L84 48 Z" fill="#99f6e4" stroke={s} strokeWidth="2" />
          <rect x="28" y="44" width="40" height="28" rx="2" fill="#ccfbf1" stroke={s} strokeWidth="2" />
          <rect x="40" y="54" width="16" height="18" fill="#134e4a" stroke={s} strokeWidth="1" />
          <path d="M44 32 L48 26 L52 32" fill="#74c365" stroke={s} strokeWidth="1" />
        </svg>
      );
    case "library":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="16" y="24" width="64" height="44" rx="2" fill="#d1fae5" stroke={s} strokeWidth="2" />
          <rect x="22" y="30" width="8" height="32" fill="#92400e" />
          <rect x="34" y="30" width="8" height="32" fill="#78350f" />
          <rect x="46" y="30" width="8" height="32" fill="#92400e" />
          <rect x="58" y="30" width="8" height="32" fill="#78350f" />
          <path d="M12 24 L48 8 L84 24" fill={fill} stroke={s} strokeWidth="2" />
        </svg>
      );
    case "lab":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="18" y="30" width="60" height="38" rx="2" fill="#ffedd5" stroke={s} strokeWidth="2" />
          <rect x="28" y="38" width="16" height="20" fill="#fff" stroke={s} strokeWidth="1" />
          <circle cx="58" cy="46" r="8" fill="#fde68a" stroke={s} strokeWidth="1" />
          <path d="M54 50 L58 42 L62 50" fill="#65a30d" opacity="0.7" />
        </svg>
      );
    case "workshop":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="20" y="36" width="56" height="32" rx="2" fill="#fef3c7" stroke={s} strokeWidth="2" />
          <path d="M16 36 L48 18 L80 36" fill="#92400e" opacity="0.3" stroke={s} strokeWidth="2" />
          <rect x="38" y="48" width="20" height="20" fill="#fff" stroke={s} strokeWidth="1.5" />
          <circle cx="28" cy="48" r="8" fill="#2d6a4f" opacity="0.5" />
        </svg>
      );
    case "observatory":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="28" y="40" width="40" height="28" rx="2" fill="#dbeafe" stroke={s} strokeWidth="2" />
          <ellipse cx="48" cy="32" rx="28" ry="14" fill="#fff" stroke={s} strokeWidth="2" />
          <line x1="48" y1="18" x2="62" y2="8" stroke={s} strokeWidth="2" />
        </svg>
      );
    case "station":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <path d="M12 56 L12 32 Q48 16 84 32 L84 56" fill={fill} stroke={s} strokeWidth="2" />
          <rect x="38" y="40" width="20" height="16" fill="#fff" stroke={s} strokeWidth="1.5" />
          <rect x="8" y="52" width="80" height="8" rx="2" fill={s} opacity="0.25" />
        </svg>
      );
    case "greenhouse":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <path d="M10 56 Q48 20 86 56" fill="#dcfce7" stroke={s} strokeWidth="2" />
          <line x1="48" y1="32" x2="48" y2="56" stroke={s} strokeWidth="1" opacity="0.4" />
          <circle cx="62" cy="50" r="6" fill="#f472b6" opacity="0.5" />
        </svg>
      );
    case "vault":
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <rect x="24" y="28" width="48" height="40" rx="4" fill="#fecdd3" stroke={s} strokeWidth="2" />
          <circle cx="48" cy="48" r="10" fill="#fff" stroke={s} strokeWidth="2" />
          <circle cx="48" cy="48" r="4" fill={s} />
          <rect x="40" y="20" width="16" height="10" rx="2" fill={fill} stroke={s} strokeWidth="1.5" />
        </svg>
      );
    case "manor":
    default:
      return (
        <svg viewBox="0 0 96 72" className="h-[72px] w-[96px]" aria-hidden>
          <path d="M10 52 L48 14 L86 52 Z" fill={fill} stroke={s} strokeWidth="2" />
          <rect x="32" y="40" width="32" height="24" rx="2" fill="#fff" stroke={s} strokeWidth="1.5" />
          <circle cx="48" cy="30" r="5" fill={s} opacity="0.4" />
        </svg>
      );
  }
}
