import type { AgentId } from "@/lib/hq/types";
import type { AgentSlug } from "@/lib/types";

export type { AgentSlug };

/** Safe label lookup — unknown agent ids fall back to the raw value instead of crashing/blanking. */
export function agentLabel(slug: string | null | undefined): string {
  if (!slug) return "Agent";
  return AGENT_SLUG_LABELS[slug as AgentSlug] ?? slug;
}

export const AGENT_SLUG_LABELS: Record<AgentSlug, string> = {
  scout: "Scout",
  roots: "Roots",
  sentinel: "Sentinel",
  bloom: "Bloom",
  sage: "Sage",
  sprout: "Sprout",
  oak: "Oak",
  ivy: "Ivy",
  atlas: "Atlas",
  fern: "Fern",
  echo: "Echo",
  gate: "Gate",
  moss: "Moss",
};

export const HQ_ID_TO_SLUG: Record<AgentId, AgentSlug> = {
  creator: "scout",
  community: "roots",
  competitor: "sentinel",
  content: "bloom",
  creative_director: "sage",
  publishing: "sprout",
  partnerships: "oak",
  chief_of_staff: "ivy",
  growth: "atlas",
  acquisition: "fern",
  customer_voice: "echo",
  approval: "gate",
};

export const SLUG_TO_HQ_ID: Record<AgentSlug, AgentId> = {
  scout: "creator",
  roots: "community",
  sentinel: "competitor",
  bloom: "content",
  sage: "creative_director",
  sprout: "publishing",
  oak: "partnerships",
  ivy: "chief_of_staff",
  atlas: "growth",
  fern: "acquisition",
  echo: "customer_voice",
  gate: "approval",
  moss: "creative_director",
};

/** Canonical inter-agent communication paths */
export const AGENT_RELATIONSHIPS: { from: AgentSlug; to: AgentSlug; label: string }[] = [
  { from: "scout", to: "oak", label: "Creator → Partnership" },
  { from: "scout", to: "bloom", label: "Trend → Content" },
  { from: "roots", to: "bloom", label: "Community → Content" },
  { from: "roots", to: "echo", label: "Community → VoC" },
  { from: "sentinel", to: "atlas", label: "Competitive → Growth" },
  { from: "echo", to: "atlas", label: "VoC → Growth" },
  { from: "atlas", to: "ivy", label: "Growth → Executive" },
  { from: "sage", to: "bloom", label: "Review → Content" },
  { from: "fern", to: "moss", label: "Creative → Brand Guardian" },
  { from: "moss", to: "gate", label: "Voice check → Approval" },
  { from: "gate", to: "sprout", label: "Approval → Publishing" },
];

export function slugToHqId(slug: AgentSlug): AgentId {
  return SLUG_TO_HQ_ID[slug];
}

export function hqIdToSlug(id: AgentId): AgentSlug {
  return HQ_ID_TO_SLUG[id];
}
