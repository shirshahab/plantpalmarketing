import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapCommunityMention,
  mapCommunityOpportunity,
  mapCommunityReplyDraft,
  mapCreatorLead,
  mapCreatorPartnership,
} from "@/lib/supabase/mappers";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getCreatorLeads() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("creator_leads")
    .select("*")
    .order("partnership_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCreatorLead);
}

export async function getCreatorLeadById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("creator_leads").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return mapCreatorLead(data);
}

export async function getCreatorPartnerships() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("creator_partnerships")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCreatorPartnership);
}

export async function getCommunityMentions() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("community_mentions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCommunityMention);
}

export async function getCommunityReplyDrafts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("community_reply_drafts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCommunityReplyDraft);
}

export async function getAgentActivityLog(agentId: "scout" | "roots", limit = 20) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getScoutStats() {
  const supabase = createServerClient();
  const today = todayStart();
  const [foundToday, highPriority, outreach, partnerships] = await Promise.all([
    supabase.from("creator_leads").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("creator_leads").select("*", { count: "exact", head: true }).eq("priority", "high"),
    supabase.from("creator_leads").select("*", { count: "exact", head: true }).eq("partnership_status", "outreach_pending"),
    supabase.from("creator_partnerships").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    foundToday: foundToday.count ?? 0,
    highPriority: highPriority.count ?? 0,
    pendingOutreach: outreach.count ?? 0,
    partnershipsCreated: partnerships.count ?? 0,
    totalLeads: (await supabase.from("creator_leads").select("*", { count: "exact", head: true })).count ?? 0,
    recommendedPartnerships: (await supabase.from("creator_partnerships").select("*", { count: "exact", head: true }).eq("status", "recommended")).count ?? 0,
  };
}

export async function getRootsStats() {
  const supabase = createServerClient();
  const today = todayStart();
  const [mentions, opportunities, replies, pending] = await Promise.all([
    supabase.from("community_mentions").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("community_opportunities").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("community_reply_drafts").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("community_reply_drafts").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return {
    mentionsToday: mentions.count ?? 0,
    opportunitiesFound: opportunities.count ?? 0,
    repliesDrafted: replies.count ?? 0,
    pendingApprovals: pending.count ?? 0,
    totalOpportunities: (await supabase.from("community_opportunities").select("*", { count: "exact", head: true })).count ?? 0,
  };
}

export async function getHQAgentData() {
  const { getSentinelHQData } = await import("@/lib/db/sentinel-queries");
  const { getBloomHQData } = await import("@/lib/db/bloom-queries");
  const { getSageHQData } = await import("@/lib/db/sage-queries");
  const { getSproutHQData } = await import("@/lib/db/sprout-queries");
  const { getOakHQData } = await import("@/lib/db/oak-queries");
  const { getIvyHQData } = await import("@/lib/db/ivy-queries");
  const { getAtlasHQData } = await import("@/lib/db/atlas-queries");
  const { getFernHQData } = await import("@/lib/db/fern-queries");
  const { getEchoHQData } = await import("@/lib/db/echo-queries");
  const { getCollaborationHQData } = await import("@/lib/db/collaboration-queries");
  const supabase = createServerClient();
  const [
    scoutStats, rootsStats, scoutActivity, rootsActivity,
    recentLeads, recentOpps, recentReplies, partnerships, sentinel, bloom, sage, sprout, oak, ivy, atlas, fern, echo, collaboration,
  ] = await Promise.all([
    getScoutStats(),
    getRootsStats(),
    getAgentActivityLog("scout", 8),
    getAgentActivityLog("roots", 8),
    getCreatorLeads().then((l) => l.slice(0, 5)),
    supabase
      .from("community_opportunities")
      .select("*")
      .order("urgency_score", { ascending: false })
      .limit(5)
      .then((r) => {
        if (r.error) throw new Error(r.error.message);
        return (r.data ?? []).map(mapCommunityOpportunity);
      }),
    getCommunityReplyDrafts().then((d) => d.filter((x) => x.status === "pending").slice(0, 5)),
    getCreatorPartnerships().then((p) => p.slice(0, 5)),
    getSentinelHQData().catch(() => null),
    getBloomHQData().catch(() => null),
    getSageHQData().catch(() => null),
    getSproutHQData().catch(() => null),
    getOakHQData().catch(() => null),
    getIvyHQData().catch(() => null),
    getAtlasHQData().catch(() => null),
    getFernHQData().catch(() => null),
    getEchoHQData().catch(() => null),
    getCollaborationHQData().catch(() => null),
  ]);

  return {
    scoutStats,
    rootsStats,
    scoutActivity,
    rootsActivity,
    recentLeads,
    recentOpportunities: recentOpps,
    pendingReplies: recentReplies,
    recommendedPartnerships: partnerships,
    sentinel,
    bloom,
    sage,
    sprout,
    oak,
    ivy,
    atlas,
    fern,
    echo,
    collaboration,
  };
}
