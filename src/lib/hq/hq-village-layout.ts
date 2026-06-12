import type { AgentId } from "@/lib/hq/types";
import { slugToHqId } from "@/lib/agents/agent-slugs";
import type { AgentSlug } from "@/lib/types";

/** Pixel coordinates on the explorable village canvas (1600 × 1200). */
export interface VillagePoint {
  x: number;
  y: number;
}

export type VillageDistrictId =
  | "founder_plaza"
  | "discovery"
  | "content"
  | "growth"
  | "operations";

export interface VillageDistrict {
  id: VillageDistrictId;
  name: string;
  theme: string;
  /** Bounding box for district label placement */
  labelAt: VillagePoint;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

export type VillageBuildingId =
  | "founder_plaza"
  | "ivy_office"
  | "scout_office"
  | "roots_cafe"
  | "sentinel_tower"
  | "bloom_studio"
  | "moss_hut"
  | "sage_office"
  | "fern_lab"
  | "oak_house"
  | "atlas_center"
  | "gate_station"
  | "sprout_house"
  | "echo_vault";

export type BuildingArtStyle =
  | "plaza"
  | "manor"
  | "cabin"
  | "cafe"
  | "tower"
  | "studio"
  | "hut"
  | "library"
  | "lab"
  | "workshop"
  | "observatory"
  | "station"
  | "greenhouse"
  | "vault";

export interface VillageBuilding {
  id: VillageBuildingId;
  name: string;
  district: VillageDistrictId;
  position: VillagePoint;
  agentId?: AgentId;
  agentName?: string;
  art: BuildingArtStyle;
  accent: string;
  href?: string;
  description: string;
}

export const VILLAGE_SIZE = { width: 1600, height: 1200 };

export const VILLAGE_DISTRICTS: VillageDistrict[] = [
  {
    id: "founder_plaza",
    name: "Founder Plaza",
    theme: "Command · Inbox · Brief",
    labelAt: { x: 800, y: 100 },
    width: 520,
    height: 260,
    fill: "#f5f3ff",
    stroke: "#7c3aed",
  },
  {
    id: "discovery",
    name: "Discovery District",
    theme: "Research · Community · Intel",
    labelAt: { x: 280, y: 380 },
    width: 440,
    height: 320,
    fill: "#ecfdf5",
    stroke: "#059669",
  },
  {
    id: "content",
    name: "Content District",
    theme: "Creative neighborhood",
    labelAt: { x: 800, y: 380 },
    width: 520,
    height: 320,
    fill: "#fdf2f8",
    stroke: "#db2777",
  },
  {
    id: "growth",
    name: "Growth District",
    theme: "Partnerships · Strategy",
    labelAt: { x: 1320, y: 380 },
    width: 400,
    height: 320,
    fill: "#fffbeb",
    stroke: "#d97706",
  },
  {
    id: "operations",
    name: "Operations District",
    theme: "Publishing · Infrastructure",
    labelAt: { x: 800, y: 780 },
    width: 1000,
    height: 320,
    fill: "#f0fdf4",
    stroke: "#2d6a4f",
  },
];

export const VILLAGE_BUILDINGS: VillageBuilding[] = [
  {
    id: "founder_plaza",
    name: "Founder Plaza",
    district: "founder_plaza",
    position: { x: 680, y: 200 },
    art: "plaza",
    accent: "#7c3aed",
    href: "/inbox",
    description: "Inbox · Approvals · Notifications · Company health",
  },
  {
    id: "ivy_office",
    name: "Ivy Office",
    district: "founder_plaza",
    position: { x: 920, y: 180 },
    agentId: "chief_of_staff",
    agentName: "Ivy",
    art: "manor",
    accent: "#5b21b6",
    href: "/ivy",
    description: "Chief of Staff · Executive brief · Priorities",
  },
  {
    id: "scout_office",
    name: "Scout Office",
    district: "discovery",
    position: { x: 140, y: 480 },
    agentId: "creator",
    agentName: "Scout",
    art: "cabin",
    accent: "#c9651f",
    href: "/creators",
    description: "Creator discovery · TikTok · Instagram · YouTube",
  },
  {
    id: "roots_cafe",
    name: "Roots Café",
    district: "discovery",
    position: { x: 320, y: 520 },
    agentId: "community",
    agentName: "Roots",
    art: "cafe",
    accent: "#356645",
    href: "/community",
    description: "Community listening · Reply drafts · F5Bot feed",
  },
  {
    id: "sentinel_tower",
    name: "Sentinel Watchtower",
    district: "discovery",
    position: { x: 480, y: 420 },
    agentId: "competitor",
    agentName: "Sentinel",
    art: "tower",
    accent: "#3d4f5f",
    href: "/competitors",
    description: "Competitor intel · Market alerts",
  },
  {
    id: "bloom_studio",
    name: "Bloom Studio",
    district: "content",
    position: { x: 620, y: 500 },
    agentId: "content",
    agentName: "Bloom",
    art: "studio",
    accent: "#db5f9a",
    href: "/bloom",
    description: "Content production · Scripts · Captions",
  },
  {
    id: "moss_hut",
    name: "Moss Brand Hut",
    district: "content",
    position: { x: 780, y: 440 },
    agentName: "Moss",
    art: "hut",
    accent: "#0d9488",
    href: "/brand",
    description: "Brand Guardian · Voice check · No em dashes",
  },
  {
    id: "sage_office",
    name: "Sage Editorial",
    district: "content",
    position: { x: 940, y: 520 },
    agentId: "creative_director",
    agentName: "Sage",
    art: "library",
    accent: "#1d5a52",
    href: "/sage",
    description: "Creative director · Quality scoring",
  },
  {
    id: "fern_lab",
    name: "Fern Creative Lab",
    district: "content",
    position: { x: 800, y: 580 },
    agentId: "acquisition",
    agentName: "Fern",
    art: "lab",
    accent: "#9c5a26",
    href: "/creative",
    description: "Images · Video · Visual assets",
  },
  {
    id: "oak_house",
    name: "Oak Partnership House",
    district: "growth",
    position: { x: 1180, y: 520 },
    agentId: "partnerships",
    agentName: "Oak",
    art: "workshop",
    accent: "#92400e",
    href: "/oak",
    description: "Partnerships · Outreach · Creator deals",
  },
  {
    id: "atlas_center",
    name: "Atlas Strategy Center",
    district: "growth",
    position: { x: 1380, y: 460 },
    agentId: "growth",
    agentName: "Atlas",
    art: "observatory",
    accent: "#0369a1",
    href: "/atlas",
    description: "Growth experiments · Calendar strategy",
  },
  {
    id: "gate_station",
    name: "Gate Workflow Station",
    district: "operations",
    position: { x: 480, y: 880 },
    agentId: "approval",
    agentName: "Gate",
    art: "station",
    accent: "#2d6a4f",
    href: "/approvals",
    description: "Approval routing · Founder queue",
  },
  {
    id: "sprout_house",
    name: "Sprout Publishing House",
    district: "operations",
    position: { x: 800, y: 920 },
    agentId: "publishing",
    agentName: "Sprout",
    art: "greenhouse",
    accent: "#1d5a96",
    href: "/calendar",
    description: "Publishing · Schedule · Calendar",
  },
  {
    id: "echo_vault",
    name: "Echo Memory Vault",
    district: "operations",
    position: { x: 1120, y: 860 },
    agentId: "customer_voice",
    agentName: "Echo",
    art: "vault",
    accent: "#9f1239",
    href: "/echo",
    description: "Voice of customer · Feedback memory",
  },
];

/** Stone paths between districts (for envelope travel). */
export const VILLAGE_PATHS: { from: VillageBuildingId; to: VillageBuildingId }[] = [
  { from: "scout_office", to: "roots_cafe" },
  { from: "roots_cafe", to: "bloom_studio" },
  { from: "bloom_studio", to: "sage_office" },
  { from: "sage_office", to: "moss_hut" },
  { from: "moss_hut", to: "gate_station" },
  { from: "gate_station", to: "sprout_house" },
  { from: "sentinel_tower", to: "atlas_center" },
  { from: "scout_office", to: "oak_house" },
  { from: "founder_plaza", to: "ivy_office" },
];

export const PLANTY_WAYPOINTS: VillagePoint[] = [
  { x: 750, y: 240 },
  { x: 620, y: 460 },
  { x: 320, y: 490 },
  { x: 800, y: 540 },
  { x: 480, y: 850 },
  { x: 1050, y: 300 },
];

export function getBuilding(id: VillageBuildingId): VillageBuilding {
  return VILLAGE_BUILDINGS.find((b) => b.id === id)!;
}

export function buildingForAgent(agentId: AgentId): VillageBuilding | undefined {
  return VILLAGE_BUILDINGS.find((b) => b.agentId === agentId);
}

export function agentIdToSlugBuilding(agentId: AgentId): VillagePoint {
  const b = buildingForAgent(agentId);
  return b ? { x: b.position.x, y: b.position.y + 40 } : { x: 800, y: 600 };
}

export function pointForAgentSlug(slug: AgentSlug): VillagePoint {
  if (slug === "moss") {
    const b = getBuilding("moss_hut");
    return { x: b.position.x, y: b.position.y + 40 };
  }
  const hqId = slugToHqId(slug);
  return agentIdToSlugBuilding(hqId);
}
