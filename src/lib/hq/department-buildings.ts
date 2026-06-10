import type { GardenZoneId } from "@/lib/hq/hq-world-layout";

export type BuildingStyle = "manor" | "tower" | "greenhouse" | "observatory" | "cafe" | "gate" | "grove" | "pond";

export interface DepartmentBuilding {
  zoneId: GardenZoneId;
  style: BuildingStyle;
  emoji: string;
  tagline: string;
  residents: string[];
}

export const DEPARTMENT_BUILDINGS: Record<GardenZoneId, DepartmentBuilding> = {
  executive_garden: {
    zoneId: "executive_garden",
    style: "manor",
    emoji: "🏛️",
    tagline: "Ivy's Executive Manor",
    residents: ["Ivy"],
  },
  watchtower: {
    zoneId: "watchtower",
    style: "tower",
    emoji: "🗼",
    tagline: "Sentinel Watchtower",
    residents: ["Sentinel"],
  },
  content_garden: {
    zoneId: "content_garden",
    style: "greenhouse",
    emoji: "🌸",
    tagline: "Bloom Greenhouse & Sage Booth",
    residents: ["Bloom", "Sage"],
  },
  growth_observatory: {
    zoneId: "growth_observatory",
    style: "observatory",
    emoji: "🔭",
    tagline: "Atlas Observatory & Fern Lab",
    residents: ["Atlas", "Fern"],
  },
  listening_post: {
    zoneId: "listening_post",
    style: "cafe",
    emoji: "☕",
    tagline: "Roots Listening Café",
    residents: ["Roots"],
  },
  launch_gate: {
    zoneId: "launch_gate",
    style: "gate",
    emoji: "🚂",
    tagline: "Gate Checkpoint & Sprout Station",
    residents: ["Gate", "Sprout"],
  },
  partnership_grove: {
    zoneId: "partnership_grove",
    style: "grove",
    emoji: "🌳",
    tagline: "Oak Treehouse & Scout Camp",
    residents: ["Oak", "Scout"],
  },
  customer_garden: {
    zoneId: "customer_garden",
    style: "pond",
    emoji: "💬",
    tagline: "Echo Reflection Pond",
    residents: ["Echo"],
  },
};
