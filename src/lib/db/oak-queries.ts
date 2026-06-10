import { createServerClient } from "@/lib/supabase";
import { mapAgentActivityLog, mapOakPartnershipDeal } from "@/lib/supabase/mappers";
import type { OakPipelineStage } from "@/lib/types";

export async function getOakPartnershipPipeline(stage?: OakPipelineStage) {
  const supabase = createServerClient();
  let query = supabase.from("oak_partnership_pipeline").select("*").order("updated_at", { ascending: false });
  if (stage) query = query.eq("stage", stage);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOakPartnershipDeal);
}

export async function getOakOutreachQueue() {
  const deals = await getOakPartnershipPipeline();
  return deals.filter((d) => !d.outreachApproved && d.outreachDraft.length > 0);
}

export async function getOakFollowUps() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("oak_partnership_pipeline")
    .select("*")
    .not("follow_up_at", "is", null)
    .order("follow_up_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOakPartnershipDeal);
}

export async function getOakActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "oak")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getOakStats() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("oak_partnership_pipeline")
    .select("stage, revenue_generated, installs_generated, follow_up_at");
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const byStage = {
    contacted: 0,
    replied: 0,
    negotiating: 0,
    active: 0,
    completed: 0,
  };
  let totalRevenue = 0;
  let totalInstalls = 0;
  let pendingOutreach = 0;

  for (const r of rows) {
    const stage = r.stage as keyof typeof byStage;
    if (stage in byStage) byStage[stage]++;
    totalRevenue += Number(r.revenue_generated);
    totalInstalls += r.installs_generated;
  }

  const outreach = await getOakOutreachQueue();
  pendingOutreach = outreach.length;

  const dueFollowUps = rows.filter((r) => r.follow_up_at && new Date(r.follow_up_at) <= new Date(Date.now() + 7 * 86400000)).length;

  return {
    total: rows.length,
    byStage,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalInstalls,
    pendingOutreach,
    dueFollowUps,
    activeDeals: byStage.active,
    negotiatingDeals: byStage.negotiating,
  };
}

export async function getOakHQData() {
  const [oakStats, oakActivity, pipeline, outreachQueue, followUps] = await Promise.all([
    getOakStats(),
    getOakActivity(8),
    getOakPartnershipPipeline().then((p) => p.slice(0, 8)),
    getOakOutreachQueue().then((q) => q.slice(0, 4)),
    getOakFollowUps().then((f) => f.slice(0, 4)),
  ]);
  return { oakStats, oakActivity, pipeline, outreachQueue, followUps };
}
