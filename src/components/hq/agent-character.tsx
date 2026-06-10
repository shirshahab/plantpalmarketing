import { cn } from "@/lib/utils";
import type { HQAgent } from "@/lib/hq/types";

function CharacterSvg({ character, accent }: { character: HQAgent["character"]; accent: string }) {
  const props = { fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (character) {
    case "scout":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <circle cx="34" cy="20" r="5" {...props} />
          <path d="M37 20 L40 18" {...props} />
        </>
      );
    case "writer":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M30 32 L38 28 L38 40 L30 44 Z" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M32 34 L36 32" {...props} />
          <path d="M32 37 L35 35" {...props} />
        </>
      );
    case "director":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <rect x="14" y="10" width="20" height="3" rx="1.5" fill={accent} opacity="0.3" />
          <path d="M20 36 L24 32 L28 36 L26 40 L22 40 Z" fill={accent} opacity="0.5" stroke={accent} strokeWidth="1" />
        </>
      );
    case "listener":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M12 22 Q8 24 10 28" {...props} />
          <path d="M36 22 Q40 24 38 28" {...props} />
          <path d="M18 38 Q24 42 30 38" {...props} />
        </>
      );
    case "scout_explorer":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M18 12 L24 8 L30 12" fill={accent} opacity="0.35" stroke={accent} strokeWidth="1" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="14" r="1.5" fill={accent} />
          <circle cx="27" cy="14" r="1.5" fill={accent} />
          <path d="M22 18 Q24 20 26 18" {...props} />
          <circle cx="36" cy="22" r="5" {...props} />
          <path d="M38 22 L41 19 M38 22 L41 25" {...props} />
          <path d="M14 36 L18 32 M14 40 L18 38" {...props} />
        </>
      );
    case "roots":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M20 10 Q24 6 28 10" fill="#74c365" opacity="0.4" stroke={accent} strokeWidth="1" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="14" r="1.5" fill={accent} />
          <circle cx="27" cy="14" r="1.5" fill={accent} />
          <path d="M12 24 Q8 26 10 30" {...props} />
          <path d="M36 24 Q40 26 38 30" {...props} />
          <path d="M22 38 Q24 44 26 38" fill="#74c365" opacity="0.5" stroke={accent} strokeWidth="1" />
        </>
      );
    case "scout_creator":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <circle cx="34" cy="30" r="4" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M33 30 L35 32 L37 28" {...props} />
        </>
      );
    case "fern":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M20 6 Q16 10 18 14 Q22 10 24 14 Q26 10 28 6" fill="#84cc16" opacity="0.5" stroke={accent} strokeWidth="0.8" />
          <path d="M26 6 Q30 10 28 14" fill="#84cc16" opacity="0.4" stroke={accent} strokeWidth="0.8" />
          <path d="M12 32 L16 28 M36 32 L32 28" {...props} />
        </>
      );
    case "echo":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M12 24 Q8 26 10 30" {...props} />
          <path d="M36 24 Q40 26 38 30" {...props} />
          <path d="M10 18 Q14 16 18 18" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M30 18 Q34 16 38 18" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M14 36 Q18 32 22 36" fill={`${accent}15`} stroke={accent} strokeWidth="1" />
          <path d="M26 36 Q30 32 34 36" fill={`${accent}15`} stroke={accent} strokeWidth="1" />
        </>
      );
    case "atlas":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M10 32 L14 28 L18 34 L22 26 L26 32 L30 24 L34 30" {...props} />
          <circle cx="38" cy="12" r="4" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M36 12 L38 10 M38 12 L40 14" {...props} />
        </>
      );
    case "ivy":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <path d="M20 8 L24 4 L28 8" {...props} />
          <circle cx="24" cy="5" r="2" fill={accent} opacity="0.5" />
          <path d="M12 20 Q8 24 10 28 M36 20 Q40 24 38 28" {...props} />
          <rect x="19" y="32" width="10" height="8" rx="1" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M21 35 L27 35 M21 38 L25 38" {...props} />
        </>
      );
    case "oak":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M24 4 L24 10 M20 8 Q24 4 28 8" {...props} />
          <path d="M18 6 Q24 2 30 6" fill="#84cc16" opacity="0.4" stroke={accent} strokeWidth="0.8" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="14" r="1.5" fill={accent} />
          <circle cx="27" cy="14" r="1.5" fill={accent} />
          <path d="M14 36 L18 32 M34 36 L30 32" {...props} />
          <rect x="20" y="34" width="8" height="6" rx="1" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M22 37 L26 37" {...props} />
        </>
      );
    case "sprout":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M24 5 Q20 9 22 12 Q24 10 26 12 Q28 9 24 5" fill="#84cc16" opacity="0.6" stroke={accent} strokeWidth="1" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="14" r="1.5" fill={accent} />
          <circle cx="27" cy="14" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <rect x="14" y="32" width="20" height="8" rx="1" fill="white" stroke={accent} strokeWidth="1.2" />
          <path d="M16 35 L20 35 M16 38 L22 38" {...props} />
          <circle cx="30" cy="36" r="2" fill={accent} opacity="0.5" />
        </>
      );
    case "sage":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <rect x="17" y="12" width="14" height="4" rx="2" fill="white" stroke={accent} strokeWidth="1.2" />
          <circle cx="21" cy="14" r="1.2" fill={accent} />
          <circle cx="27" cy="14" r="1.2" fill={accent} />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <rect x="28" y="30" width="10" height="12" rx="1" fill="white" stroke={accent} strokeWidth="1.2" />
          <path d="M30 33 L36 33 M30 36 L35 36 M30 39 L34 39" {...props} />
          <path d="M31 42 L35 42" {...props} stroke="#f59e0b" />
        </>
      );
    case "bloom":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M24 6 Q18 10 20 14 Q24 12 28 14 Q30 10 24 6" fill="#f472b6" opacity="0.55" stroke={accent} strokeWidth="1" />
          <path d="M16 10 Q20 8 24 10 Q28 8 32 10" fill="#fda4af" opacity="0.4" stroke={accent} strokeWidth="0.8" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="14" r="1.5" fill={accent} />
          <circle cx="27" cy="14" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <path d="M30 32 L38 28 L38 40 L30 44 Z" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M32 34 L36 32 M32 37 L35 35" {...props} />
        </>
      );
    case "sentinel":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M14 12 L24 9 L34 12 L32 15 L16 15 Z" fill={accent} opacity="0.25" stroke={accent} strokeWidth="1" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <rect x="18" y="12" width="12" height="4" rx="1" fill={accent} opacity="0.4" />
          <circle cx="21" cy="14" r="1" fill={accent} />
          <circle cx="27" cy="14" r="1" fill={accent} />
          <path d="M10 22 L14 20 M34 22 L38 20" {...props} />
          <rect x="20" y="32" width="8" height="6" rx="1" fill="white" stroke={accent} strokeWidth="1" />
          <path d="M22 35 L26 37" {...props} />
        </>
      );
    case "watchtower":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M10 36 L24 30 L38 36 L36 44 L12 44 Z" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M24 30 L24 24" {...props} />
        </>
      );
    case "gatekeeper":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <rect x="20" y="32" width="8" height="10" rx="1" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M22 37 L26 40 L30 34" {...props} stroke="#74c365" />
        </>
      );
  }
}

export function AgentCharacter({
  agent,
  floatDelay,
  isActive,
}: {
  agent: HQAgent;
  floatDelay: string;
  isActive?: boolean;
}) {
  const working = ["researching", "writing", "reviewing", "needs_attention"].includes(agent.status);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        `hq-float ${floatDelay}`,
        working && "hq-breathe"
      )}
    >
      {working && (
        <div
          className="hq-pulse-ring absolute inset-0 rounded-2xl text-brand-accent"
          style={{ color: agent.accent }}
        />
      )}
      <div
        className={cn(
          "relative rounded-2xl border-2 bg-white/90 p-1 shadow-md backdrop-blur-sm transition-shadow",
          isActive && "shadow-lg ring-2 ring-brand-accent/40"
        )}
        style={{ borderColor: `${agent.accent}55` }}
      >
        <svg width="48" height="52" viewBox="0 0 48 52" aria-hidden>
          <CharacterSvg character={agent.character} accent={agent.accent} />
        </svg>
      </div>
      <div
        className="mt-1 h-1 w-8 rounded-full opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accent}, transparent)` }}
      />
    </div>
  );
}
