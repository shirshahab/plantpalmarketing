import type { AgentId } from "@/lib/hq/types";

export type GardenZoneId =
  | "executive_garden"
  | "growth_observatory"
  | "content_garden"
  | "partnership_grove"
  | "listening_post"
  | "watchtower"
  | "launch_gate"
  | "customer_garden";

export interface WorldPoint {
  x: number;
  y: number;
}

export interface GardenZone {
  id: GardenZoneId;
  name: string;
  subtitle: string;
  center: WorldPoint;
  width: number;
  height: number;
  color: string;
  accent: string;
}

export const GARDEN_ZONES: GardenZone[] = [
  {
    id: "executive_garden",
    name: "Executive Garden",
    subtitle: "Ivy · Command",
    center: { x: 50, y: 14 },
    width: 26,
    height: 12,
    color: "#f5f3ff",
    accent: "#5b21b6",
  },
  {
    id: "watchtower",
    name: "Watchtower",
    subtitle: "Sentinel · Intel",
    center: { x: 18, y: 32 },
    width: 20,
    height: 14,
    color: "#f1f5f9",
    accent: "#3d4f5f",
  },
  {
    id: "content_garden",
    name: "Content Garden",
    subtitle: "Bloom · Sage",
    center: { x: 50, y: 34 },
    width: 28,
    height: 16,
    color: "#fdf2f8",
    accent: "#e85d9a",
  },
  {
    id: "growth_observatory",
    name: "Growth Observatory",
    subtitle: "Atlas · Fern",
    center: { x: 82, y: 32 },
    width: 22,
    height: 14,
    color: "#f0f9ff",
    accent: "#0369a1",
  },
  {
    id: "listening_post",
    name: "Listening Post",
    subtitle: "Roots · Community",
    center: { x: 18, y: 58 },
    width: 20,
    height: 14,
    color: "#ecfdf5",
    accent: "#6b9b7a",
  },
  {
    id: "launch_gate",
    name: "Launch Gate",
    subtitle: "Gate · Sprout",
    center: { x: 50, y: 58 },
    width: 26,
    height: 14,
    color: "#f7fee7",
    accent: "#65a30d",
  },
  {
    id: "partnership_grove",
    name: "Partnership Grove",
    subtitle: "Oak · Scout",
    center: { x: 82, y: 58 },
    width: 22,
    height: 14,
    color: "#fffbeb",
    accent: "#92400e",
  },
  {
    id: "customer_garden",
    name: "Customer Garden",
    subtitle: "Echo · VoC",
    center: { x: 50, y: 82 },
    width: 26,
    height: 12,
    color: "#fff1f2",
    accent: "#9f1239",
  },
];

/** Home position + zone for each agent */
export const AGENT_WORLD_POSITIONS: Record<
  AgentId,
  { home: WorldPoint; zone: GardenZoneId; subStation?: string }
> = {
  chief_of_staff: { home: { x: 50, y: 14 }, zone: "executive_garden" },
  competitor: { home: { x: 18, y: 32 }, zone: "watchtower" },
  content: { home: { x: 44, y: 34 }, zone: "content_garden", subStation: "Content Beds" },
  creative_director: { home: { x: 56, y: 34 }, zone: "content_garden", subStation: "Review Booth" },
  growth: { home: { x: 78, y: 32 }, zone: "growth_observatory" },
  acquisition: { home: { x: 86, y: 32 }, zone: "growth_observatory", subStation: "Greenhouse" },
  community: { home: { x: 18, y: 58 }, zone: "listening_post" },
  approval: { home: { x: 44, y: 58 }, zone: "launch_gate", subStation: "Launch Gate" },
  publishing: { home: { x: 56, y: 58 }, zone: "launch_gate", subStation: "Schedule Desk" },
  partnerships: { home: { x: 86, y: 58 }, zone: "partnership_grove" },
  creator: { home: { x: 76, y: 54 }, zone: "partnership_grove", subStation: "Talent Desk" },
  customer_voice: { home: { x: 50, y: 82 }, zone: "customer_garden" },
};

export const WORLD_PATHS: { from: GardenZoneId; to: GardenZoneId; label?: string }[] = [
  { from: "partnership_grove", to: "partnership_grove", label: "Scout → Oak handoff" },
  { from: "partnership_grove", to: "launch_gate", label: "Oak → Gate" },
  { from: "launch_gate", to: "launch_gate", label: "Gate → Sprout" },
  { from: "listening_post", to: "content_garden" },
  { from: "watchtower", to: "growth_observatory" },
  { from: "customer_garden", to: "growth_observatory" },
  { from: "growth_observatory", to: "executive_garden" },
  { from: "content_garden", to: "launch_gate" },
];

export function getZone(id: GardenZoneId): GardenZone {
  return GARDEN_ZONES.find((z) => z.id === id)!;
}
