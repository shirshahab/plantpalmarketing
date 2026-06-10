import type { AgentId } from "@/lib/hq/types";

export interface AgentPersonality {
  agentId: AgentId;
  greeting: string;
  walkQuip: string;
  workingQuip: string;
  handoffQuip: string;
  buildingRole: string;
}

export const AGENT_PERSONALITIES: Record<AgentId, AgentPersonality> = {
  chief_of_staff: {
    agentId: "chief_of_staff",
    greeting: "Morning briefing ready when you are, founder.",
    walkQuip: "Ivy is crossing the executive lawn with priorities.",
    workingQuip: "Orchestrating the whole company garden.",
    handoffQuip: "Executive directive en route.",
    buildingRole: "Runs the Executive Manor",
  },
  creator: {
    agentId: "creator",
    greeting: "Found three creators worth your attention overnight.",
    walkQuip: "Scout spotted talent — heading to Oak with a lead.",
    workingQuip: "Scanning TikTok, Instagram, and creator graphs.",
    handoffQuip: "Creator lead in hand — partnership time.",
    buildingRole: "Camps at the Talent Tent",
  },
  community: {
    agentId: "community",
    greeting: "Reddit and X are chatty this morning.",
    walkQuip: "Roots carrying a community thread to Bloom.",
    workingQuip: "Listening for plant parents who need help.",
    handoffQuip: "Community insight packaged for content.",
    buildingRole: "Hosts the Listening Café",
  },
  competitor: {
    agentId: "competitor",
    greeting: "Competitors were busy while you slept.",
    walkQuip: "Sentinel climbing down the watchtower with intel.",
    workingQuip: "Radar sweep across eight plant apps.",
    handoffQuip: "Threat brief for Atlas.",
    buildingRole: "Guards the Watchtower",
  },
  content: {
    agentId: "content",
    greeting: "Fresh content beds are growing ideas.",
    walkQuip: "Bloom heading to the greenhouse with new angles.",
    workingQuip: "Drafting hooks that plant parents share.",
    handoffQuip: "Content draft ready for Sage.",
    buildingRole: "Tends the Content Greenhouse",
  },
  creative_director: {
    agentId: "creative_director",
    greeting: "Quality bar is up. Weak hooks don't pass.",
    walkQuip: "Sage reviewing at the critique booth.",
    workingQuip: "Scoring every draft before humans see it.",
    handoffQuip: "Approved piece to Gate.",
    buildingRole: "Judges at the Review Booth",
  },
  publishing: {
    agentId: "publishing",
    greeting: "Schedule desk is lined up — nothing auto-posts.",
    walkQuip: "Sprout rolling the publish cart to the gate.",
    workingQuip: "Timing posts for peak plant-parent hours.",
    handoffQuip: "Queued for human publish only.",
    buildingRole: "Runs the Schedule Station",
  },
  partnerships: {
    agentId: "partnerships",
    greeting: "Partnership grove has new opportunities.",
    walkQuip: "Oak meeting Scout with outreach drafts ready.",
    workingQuip: "Building relationships — humans send every message.",
    handoffQuip: "Partnership idea needs your approval.",
    buildingRole: "Lives in the Partnership Treehouse",
  },
  growth: {
    agentId: "growth",
    greeting: "Growth levers updated overnight.",
    walkQuip: "Atlas crossing to the observatory dome.",
    workingQuip: "Modeling the path to 1M plant parents.",
    handoffQuip: "Growth experiment for Ivy's brief.",
    buildingRole: "Studies at the Observatory",
  },
  acquisition: {
    agentId: "acquisition",
    greeting: "New install channels look promising.",
    walkQuip: "Fern checking the growth greenhouse.",
    workingQuip: "Hunting traffic that converts to installs.",
    handoffQuip: "Acquisition test proposal ready.",
    buildingRole: "Experiments in the Growth Greenhouse",
  },
  customer_voice: {
    agentId: "customer_voice",
    greeting: "Customers left love notes and pain points.",
    walkQuip: "Echo walking feedback to Atlas.",
    workingQuip: "Listening — never replying without you.",
    handoffQuip: "VoC insight routed upstream.",
    buildingRole: "Reflects at the Echo Pond",
  },
  approval: {
    agentId: "approval",
    greeting: "Gate is closed until you say go.",
    walkQuip: "Gate handing approved work to Sprout.",
    workingQuip: "Nothing leaves without founder sign-off.",
    handoffQuip: "Approved — awaiting your final OK.",
    buildingRole: "Stands at the Launch Gate",
  },
};

export function getPersonality(agentId: AgentId): AgentPersonality {
  return AGENT_PERSONALITIES[agentId];
}
