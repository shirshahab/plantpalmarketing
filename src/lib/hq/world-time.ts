export type DayPhase = "dawn" | "day" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface WorldTimeState {
  phase: DayPhase;
  season: Season;
  hour: number;
  label: string;
  skyGradient: [string, string, string];
  overlayOpacity: number;
  ambientTint: string;
}

export function getSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function getDayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

const PHASE_SKY: Record<DayPhase, [string, string, string]> = {
  dawn: ["#ffd6a5", "#e8f5ec", "#b8d4c8"],
  day: ["#87ceeb", "#e8f5ec", "#dceee3"],
  dusk: ["#f4a261", "#e8c4b8", "#9bb8a8"],
  night: ["#1a1f3c", "#2d4a3e", "#1e3a2f"],
};

const PHASE_OVERLAY: Record<DayPhase, number> = {
  dawn: 0.08,
  day: 0,
  dusk: 0.12,
  night: 0.45,
};

const PHASE_TINT: Record<DayPhase, string> = {
  dawn: "rgba(255, 200, 120, 0.15)",
  day: "transparent",
  dusk: "rgba(244, 162, 97, 0.12)",
  night: "rgba(30, 50, 90, 0.35)",
};

const SEASON_ACCENT: Record<Season, string> = {
  spring: "#f9a8d4",
  summer: "#fde047",
  autumn: "#fb923c",
  winter: "#93c5fd",
};

export function getWorldTimeState(date = new Date()): WorldTimeState {
  const hour = date.getHours();
  const phase = getDayPhase(hour);
  const season = getSeason(date);
  const phaseLabels: Record<DayPhase, string> = {
    dawn: "Dawn in the garden",
    day: "Bright workday",
    dusk: "Golden hour",
    night: "Night watch",
  };

  return {
    phase,
    season,
    hour,
    label: `${phaseLabels[phase]} · ${season}`,
    skyGradient: PHASE_SKY[phase],
    overlayOpacity: PHASE_OVERLAY[phase],
    ambientTint: PHASE_TINT[phase],
  };
}

export function getSeasonAccent(season: Season): string {
  return SEASON_ACCENT[season];
}
