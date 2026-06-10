import { createServerClient } from "@/lib/supabase/server";
import { runDiscoveryAgent } from "@/lib/agents/discovery-agent";
import { runContentAgent } from "@/lib/agents/content-agent";
import { reviewAndRefineContent } from "@/lib/agents/creative-director-agent";
import type { ScoredContentDraft } from "@/lib/agents/types";
import { getCompetitorAlerts } from "@/lib/db/queries";

export interface PipelineRunResult {
  briefId: string;
  discoveryCount: number;
  contentCount: number;
  approvedCount: number;
  rejectedCount: number;
  approvalQueueCount: number;
}

function mapApprovalType(format: string): string {
  if (format.includes("blog")) return "content";
  if (format.includes("carousel")) return "content";
  if (format.includes("tiktok") || format.includes("reels") || format.includes("shorts")) {
    return "video_script";
  }
  return "social_post";
}

export async function runDailyContentPipeline(): Promise<PipelineRunResult> {
  const supabase = createServerClient();

  const { data: brief, error: briefError } = await supabase
    .from("agent_daily_briefs")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (briefError || !brief) {
    throw new Error(briefError?.message ?? "Failed to create daily brief");
  }

  const briefId = brief.id;

  try {
    const discovery = await runDiscoveryAgent(async () => {
      const alerts = await getCompetitorAlerts();
      return alerts.map((a) => ({
        competitor: a.competitor,
        title: a.title,
        description: a.description,
      }));
    });

    await supabase.from("agent_daily_briefs").update({
      discovery_summary: discovery.summary,
    }).eq("id", briefId);

    if (discovery.items.length > 0) {
      const { error: discError } = await supabase.from("discovery_items").insert(
        discovery.items.map((item) => ({
          brief_id: briefId,
          item_type: item.item_type,
          title: item.title,
          description: item.description,
          source: item.source,
          relevance_score: item.relevance_score,
        }))
      );
      if (discError) throw new Error(discError.message);
    }

    const drafts = await runContentAgent(discovery.items);
    const scored: ScoredContentDraft[] = [];

    for (const draft of drafts) {
      const reviewed = await reviewAndRefineContent(draft);
      scored.push(reviewed);
    }

    const approved = scored.filter((s) => s.status !== "rejected");
    const rejected = scored.filter((s) => s.status === "rejected");

    if (scored.length > 0) {
      const { data: inserted, error: pipeError } = await supabase
        .from("pipeline_content")
        .insert(
          scored.map((s) => ({
            brief_id: briefId,
            platform: s.platform,
            format: s.format,
            hook: s.hook,
            caption: s.caption,
            cta: s.cta,
            viral_score: s.viral_score,
            originality_score: s.originality_score,
            humor_score: s.humor_score,
            emotional_impact_score: s.emotional_impact_score,
            shareability_score: s.shareability_score,
            educational_score: s.educational_score,
            aggregate_score: s.aggregate_score,
            director_notes: s.director_notes,
            rewrite_count: s.rewrite_count,
            status: s.status,
          }))
        )
        .select("id, platform, format, hook, caption, cta, status");

      if (pipeError) throw new Error(pipeError.message);

      const approvalRows = (inserted ?? [])
        .filter((row) => row.status !== "rejected")
        .map((row) => ({
          type: mapApprovalType(row.format),
          channel: row.platform,
          draft: `${row.hook}\n\n${row.caption}\n\nCTA: ${row.cta}`.slice(0, 2000),
          status: "pending" as const,
          source_id: row.id,
        }));

      if (approvalRows.length > 0) {
        const { error: aqError } = await supabase
          .from("approval_queue")
          .insert(approvalRows);
        if (aqError) throw new Error(aqError.message);
      }
    }

    await supabase.from("agent_daily_briefs").update({
      status: "completed",
      content_count: scored.length,
      approved_count: approved.length,
      rejected_count: rejected.length,
    }).eq("id", briefId);

    return {
      briefId,
      discoveryCount: discovery.items.length,
      contentCount: scored.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      approvalQueueCount: approved.length,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline failed";
    await supabase.from("agent_daily_briefs").update({
      status: "failed",
      error_message: message,
    }).eq("id", briefId);
    throw e;
  }
}
