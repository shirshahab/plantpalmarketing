import {
  buildInputSignals,
  generateDailyContent,
  TOTAL_DAILY_PIECES,
} from "@/lib/agents/bloom/mock-generator";
import { createServerClient } from "@/lib/supabase/server";
import { bloomDraftXPost, bloomEnrichContentContext } from "@/lib/integrations/agent-integrations";
export interface BloomRunResult {
  runId: string;
  piecesGenerated: number;
  piecesAwaitingReview: number;
  scoutInputs: number;
  rootsInputs: number;
  sentinelInputs: number;
  seasonalInputs: number;
}

export async function runBloomAgent(): Promise<BloomRunResult> {
  const supabase = createServerClient();

  const [leads, opportunities, alerts] = await Promise.all([
    supabase.from("creator_leads").select("category, suggested_ideas").order("partnership_score", { ascending: false }).limit(5),
    supabase.from("community_opportunities").select("topic, question, post").order("urgency_score", { ascending: false }).limit(5),
    supabase.from("competitor_intel_alerts").select("title, competitor").eq("status", "active").order("created_at", { ascending: false }).limit(5),
  ]);

  const scoutTopics = (leads.data ?? []).flatMap((l) => {
    const ideas = Array.isArray(l.suggested_ideas) ? (l.suggested_ideas as string[]) : [];
    return [l.category, ...ideas].filter(Boolean);
  });
  const rootsTopics = (opportunities.data ?? []).map((o) => o.topic || o.question || o.post?.slice(0, 40) || "community question");
  const sentinelTopics = (alerts.data ?? []).map((a) => `${a.competitor}: ${a.title}`);

  const signals = buildInputSignals({ scoutTopics, rootsTopics, sentinelTopics });
  let enrichment = "";
  try {
    enrichment = await bloomEnrichContentContext(rootsTopics[0] ?? "houseplants");
  } catch {
    /* optional weather/plant enrichment */
  }
  const pieces = generateDailyContent(signals);

  const scoutInputs = signals.filter((s) => s.sourceType === "scout_discovery").length;
  const rootsInputs = signals.filter((s) => s.sourceType === "roots_conversation").length;
  const sentinelInputs = signals.filter((s) => s.sourceType === "sentinel_alert").length;
  const seasonalInputs = signals.filter((s) => s.sourceType === "seasonal_event").length;

  const { data: runRow, error: runError } = await supabase
    .from("bloom_production_runs")
    .insert({
      status: "running",
      scout_inputs: scoutInputs,
      roots_inputs: rootsInputs,
      sentinel_inputs: sentinelInputs,
      seasonal_inputs: seasonalInputs,
    })
    .select("id")
    .single();

  if (runError || !runRow) throw new Error(runError?.message ?? "Failed to create production run");

  let piecesAwaitingReview = 0;

  for (const piece of pieces) {
    const { data: inserted, error: pieceError } = await supabase
      .from("bloom_content_pieces")
      .insert({
        run_id: runRow.id,
        format: piece.format,
        platform: piece.platform,
        title: piece.title,
        hook: piece.hook,
        caption: piece.caption,
        cta: piece.cta,
        viral_score: piece.viralScore,
        emotional_trigger: piece.emotionalTrigger,
        difficulty_score: piece.difficultyScore,
        source_type: piece.sourceType,
        source_detail: piece.sourceDetail,
        scheduled_date: piece.scheduledDate,
        status: "awaiting_review",
      })
      .select("id")
      .single();

    if (pieceError || !inserted) throw new Error(pieceError?.message ?? "Failed to insert content piece");
    piecesAwaitingReview++;

    if (piece.platform === "X" || piece.format === "x_post") {
      const xText = [piece.hook, piece.caption, piece.cta].filter(Boolean).join(" ").slice(0, 280);
      const draftText = enrichment ? `${xText}` : xText;
      try {
        await bloomDraftXPost(draftText, inserted.id);
      } catch {
        /* X draft is best-effort */
      }
    }
  }

  await supabase
    .from("bloom_production_runs")
    .update({
      status: "completed",
      pieces_generated: pieces.length,
      pieces_queued: 0,
    })
    .eq("id", runRow.id);

  await supabase.from("agent_activity_log").insert({
    agent_id: "bloom",
    action: "production_complete",
    detail: `Daily batch complete — ${pieces.length} pieces sent to Sage for Creative Director review`,
    metadata: { run_id: runRow.id, pieces: pieces.length, awaiting_review: piecesAwaitingReview },
  });

  return {
    runId: runRow.id,
    piecesGenerated: pieces.length,
    piecesAwaitingReview,
    scoutInputs,
    rootsInputs,
    sentinelInputs,
    seasonalInputs,
  };
}

export { TOTAL_DAILY_PIECES };
