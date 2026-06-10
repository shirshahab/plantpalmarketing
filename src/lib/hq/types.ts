import type { AgentActivityLog } from "@/lib/types";

export type AgentStatus =
  | "researching"
  | "writing"
  | "reviewing"
  | "waiting_for_approval"
  | "approved"
  | "needs_attention"
  | "paused";

export type ScoutAgentState = "searching" | "analyzing" | "scoring" | "found_match" | "idle";
export type RootsAgentState = "listening" | "monitoring" | "finding_opportunity" | "drafting_reply" | "awaiting_approval";

export type AgentId =
  | "chief_of_staff"
  | "growth"
  | "acquisition"
  | "customer_voice"
  | "publishing"
  | "content"
  | "creative_director"
  | "community"
  | "creator"
  | "competitor"
  | "partnerships"
  | "approval";

export type SentinelAgentState =
  | "monitoring"
  | "analyzing"
  | "alert_detected"
  | "reporting"
  | "idle";

export type HQCharacter =
  | "scout"
  | "writer"
  | "director"
  | "listener"
  | "roots"
  | "scout_explorer"
  | "scout_creator"
  | "watchtower"
  | "sentinel"
  | "bloom"
  | "sage"
  | "sprout"
  | "oak"
  | "ivy"
  | "atlas"
  | "fern"
  | "echo"
  | "gatekeeper";

export interface HQAgent {
  id: AgentId;
  name: string;
  role: string;
  station: string;
  status: AgentStatus;
  agentState?: ScoutAgentState | RootsAgentState | string;
  currentTask: string;
  progress: number;
  lastUpdate: string;
  itemsCreated: number;
  itemsNeedingReview: number;
  accent: string;
  character: HQCharacter;
  stats?: Record<string, number | undefined>;
  activity?: AgentActivityLog[];
  unreadMessages?: number;
  activeTasks?: number;
}

export type HQAgentData = HQAgent;

export type ActivityType =
  | "key_update"
  | "content_draft"
  | "suggested_post"
  | "comment_found"
  | "community_opportunity"
  | "creator_lead"
  | "competitor_alert"
  | "approval_needed"
  | "scout_found_creator"
  | "roots_found_discussion"
  | "suggested_partnership"
  | "reply_awaiting_approval"
  | "competitor_feature"
  | "competitor_viral"
  | "competitor_brief"
  | "bloom_batch"
  | "bloom_content_draft"
  | "sage_review_batch"
  | "sage_rejection"
  | "sage_approval"
  | "sprout_scheduled"
  | "sprout_ready"
  | "sprout_published"
  | "oak_partnership"
  | "oak_outreach"
  | "oak_follow_up"
  | "ivy_recommendation"
  | "ivy_alert"
  | "ivy_brief"
  | "ivy_daily_report"
  | "atlas_recommendation"
  | "atlas_forecast"
  | "atlas_experiment"
  | "atlas_bottleneck"
  | "atlas_growth_brief"
  | "fern_opportunity"
  | "fern_experiment"
  | "fern_forecast"
  | "fern_acquisition"
  | "echo_feature_request"
  | "echo_sentiment"
  | "echo_churn"
  | "echo_love"
  | "echo_voc_report"
  | "echo_voc_scan"
  | "collab_message"
  | "collab_task"
  | "collab_event"
  | "collab_task_done";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  summary: string;
  timestamp: string;
  agentId?: AgentId;
  platform?: string;
  priority?: "low" | "medium" | "high";
  draft?: string;
  status?: "pending" | "approved" | "rejected";
  entityId?: string;
}
