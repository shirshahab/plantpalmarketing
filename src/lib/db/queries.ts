import { createServerClient } from "@/lib/supabase";
import type { MarketingTable } from "@/lib/types";
import {
  mapApprovalItem,
  mapCommunityOpportunity,
  mapCompetitorAlert,
  mapContentIdea,
  mapCreativeContentIdea,
  mapCreator,
  mapImagePrompt,
  mapPartnership,
  mapReplyDraft,
  mapSocialPost,
  mapVideoScript,
} from "@/lib/supabase/mappers";
import type { DashboardStats } from "@/lib/types";

async function countTable(table: MarketingTable, filter?: { column: string; value: string }) {
  const supabase = createServerClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    contentIdeas,
    postsDrafted,
    creatorsFound,
    partnershipLeads,
    competitorAlerts,
    communityOpportunities,
    approvedPosts,
    pendingApprovals,
  ] = await Promise.all([
    countTable("creative_content_ideas"),
    countTable("social_posts"),
    countTable("creators"),
    countTable("partnerships"),
    countTable("competitor_alerts"),
    countTable("community_opportunities"),
    countTable("social_posts", { column: "status", value: "approved" }),
    countTable("approval_queue", { column: "status", value: "pending" }),
  ]);

  return {
    contentIdeas,
    postsDrafted,
    creatorsFound,
    partnershipLeads,
    competitorAlerts,
    communityOpportunities,
    approvedPosts,
    pendingApprovals,
  };
}

export async function getContentIdeas() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapContentIdea);
}

export async function getCreativeContentIdeas() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("creative_content_ideas")
    .select("*")
    .order("viral_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCreativeContentIdea);
}

export async function getSocialPosts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSocialPost);
}

export async function getImagePrompts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("image_prompts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapImagePrompt);
}

export async function getVideoScripts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("video_scripts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVideoScript);
}

export async function getCommunityOpportunities() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("community_opportunities")
    .select("*")
    .order("urgency_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCommunityOpportunity);
}

export async function getReplyDrafts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reply_drafts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapReplyDraft);
}

export async function getCreators() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .order("followers", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCreator);
}

export async function getPartnerships() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("partnerships")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPartnership);
}

export async function getCompetitorAlerts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("competitor_alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCompetitorAlert);
}

export async function getApprovalQueue() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("approval_queue")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapApprovalItem);
}

export async function getRecentActivity() {
  const supabase = createServerClient();

  const [content, creators, alerts, approvals] = await Promise.all([
    supabase.from("content_ideas").select("title, created_at").order("created_at", { ascending: false }).limit(2),
    supabase.from("creators").select("name, followers, created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("competitor_alerts").select("title, competitor, created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("approval_queue").select("draft, channel, status, updated_at").eq("status", "approved").order("updated_at", { ascending: false }).limit(1),
  ]);

  const items: { id: string; action: string; detail: string; time: string }[] = [];

  content.data?.forEach((row, i) => {
    items.push({
      id: `content-${i}`,
      action: "Content idea saved",
      detail: row.title,
      time: row.created_at,
    });
  });

  creators.data?.forEach((row, i) => {
    items.push({
      id: `creator-${i}`,
      action: "Creator added to CRM",
      detail: `${row.name} — ${row.followers?.toLocaleString()} followers`,
      time: row.created_at,
    });
  });

  alerts.data?.forEach((row, i) => {
    items.push({
      id: `alert-${i}`,
      action: "Competitor alert",
      detail: `${row.competitor}: ${row.title}`,
      time: row.created_at,
    });
  });

  approvals.data?.forEach((row, i) => {
    items.push({
      id: `approval-${i}`,
      action: "Item approved",
      detail: `${row.channel} — ${row.draft.slice(0, 60)}…`,
      time: row.updated_at,
    });
  });

  return items
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
}
