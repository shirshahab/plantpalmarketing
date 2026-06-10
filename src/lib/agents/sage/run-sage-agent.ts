import { scoreBloomPiece, SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";
import { mapBloomContentPiece } from "@/lib/supabase/mappers";
import { createServerClient } from "@/lib/supabase/server";
import { attachSageScoreToCalendar } from "@/lib/content-calendar/sync";
import { recordAutomationRun } from "@/lib/automation/engine";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { BloomContentFormat } from "@/lib/types";

export interface SageRunResult {
  batchId: string;
  piecesReviewed: number;
  approvedCount: number;
  rejectedCount: number;
  avgAggregateScore: number;
  approvalQueueCount: number;
}

function approvalType(format: BloomContentFormat): "social_post" | "content" {
  return ["blog_idea", "email_idea"].includes(format) ? "content" : "social_post";
}

function formatDraft(piece: {
  platform: string;
  format: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  viralScore: number;
  emotionalTrigger: string;
  aggregateScore: number;
  hookSuggestion: string;
  ctaSuggestion: string;
}): string {
  return [
    `[${piece.platform} · ${piece.format}] ${piece.title}`,
    `Sage aggregate score: ${piece.aggregateScore}/100 ✓`,
    "",
    `Hook: ${piece.hook}`,
    `Sage hook note: ${piece.hookSuggestion}`,
    "",
    `Caption: ${piece.caption}`,
    "",
    `CTA: ${piece.cta}`,
    `Sage CTA note: ${piece.ctaSuggestion}`,
    "",
    `Bloom viral: ${piece.viralScore} | Trigger: ${piece.emotionalTrigger}`,
  ].join("\n");
}

export async function runSageAgent(): Promise<SageRunResult> {
  const supabase = createServerClient();

  const { data: awaiting, error: fetchError } = await supabase
    .from("bloom_content_pieces")
    .select("*")
    .eq("status", "awaiting_review")
    .order("created_at", { ascending: true });

  if (fetchError) throw new Error(fetchError.message);
  if (!awaiting?.length) {
    throw new Error("No Bloom pieces awaiting Sage review");
  }

  const { data: batchRow, error: batchError } = await supabase
    .from("sage_review_batches")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (batchError || !batchRow) throw new Error(batchError?.message ?? "Failed to create review batch");

  let approvedCount = 0;
  let rejectedCount = 0;
  let approvalQueueCount = 0;
  let scoreSum = 0;

  for (const row of awaiting) {
    const piece = mapBloomContentPiece(row);

    const scores = scoreBloomPiece(piece);
    scoreSum += scores.aggregateScore;

    const { error: reviewError } = await supabase.from("sage_content_reviews").insert({
      batch_id: batchRow.id,
      bloom_piece_id: row.id,
      originality_score: scores.originalityScore,
      humor_score: scores.humorScore,
      emotional_impact_score: scores.emotionalImpactScore,
      shareability_score: scores.shareabilityScore,
      storytelling_score: scores.storytellingScore,
      educational_score: scores.educationalScore,
      aggregate_score: scores.aggregateScore,
      recommendation: scores.recommendation,
      rejection_reason: scores.rejectionReason,
      hook_suggestion: scores.hookSuggestion,
      cta_suggestion: scores.ctaSuggestion,
      storytelling_suggestion: scores.storytellingSuggestion,
      creative_opportunity: scores.creativeOpportunity,
    });

    if (reviewError) throw new Error(reviewError.message);

    // Phase 26: creative score lands on the calendar item automatically
    await attachSageScoreToCalendar(row.id, {
      aggregateScore: scores.aggregateScore,
      recommendation: scores.recommendation,
      hookSuggestion: scores.hookSuggestion,
      ctaSuggestion: scores.ctaSuggestion,
    });

    if (scores.recommendation === "approve") {
      const { error: statusError } = await supabase
        .from("bloom_content_pieces")
        .update({ status: "pending" })
        .eq("id", row.id);
      if (statusError) throw new Error(statusError.message);

      const { error: aqError } = await supabase.from("approval_queue").insert({
        type: approvalType(piece.format),
        channel: piece.platform,
        draft: formatDraft({
          platform: piece.platform,
          format: piece.format,
          title: piece.title,
          hook: piece.hook,
          caption: piece.caption,
          cta: piece.cta,
          viralScore: piece.viralScore,
          emotionalTrigger: piece.emotionalTrigger,
          aggregateScore: scores.aggregateScore,
          hookSuggestion: scores.hookSuggestion,
          ctaSuggestion: scores.ctaSuggestion,
        }),
        status: "pending",
        source_id: row.id,
      });
      if (aqError) throw new Error(aqError.message);

      approvedCount++;
      approvalQueueCount++;
    } else {
      const { error: statusError } = await supabase
        .from("bloom_content_pieces")
        .update({ status: "rejected" })
        .eq("id", row.id);
      if (statusError) throw new Error(statusError.message);
      rejectedCount++;
    }
  }

  const avgAggregateScore = Math.round((scoreSum / awaiting.length) * 10) / 10;

  await supabase
    .from("sage_review_batches")
    .update({
      status: "completed",
      pieces_reviewed: awaiting.length,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      avg_aggregate_score: avgAggregateScore,
    })
    .eq("id", batchRow.id);

  await supabase.from("agent_activity_log").insert({
    agent_id: "sage",
    action: "review_complete",
    detail: `Reviewed ${awaiting.length} pieces — ${approvedCount} approved (≥${SAGE_PASS_THRESHOLD}), ${rejectedCount} rejected`,
    metadata: { batch_id: batchRow.id, approved: approvedCount, rejected: rejectedCount },
  });

  // Phase 28: approved work moves to Gate, weak work goes back to Bloom
  if (approvedCount > 0) {
    await recordHandoff({
      fromAgent: "sage",
      toAgent: "gate",
      workflowName: "Sage → Gate",
      triggerType: "scored_content",
      triggerId: batchRow.id,
      taskType: "approval_decision",
      taskDescription: `${approvedCount} Sage-approved pieces are in the approval queue. Auto-approve low-risk internal items, hold high-risk for the founder, send approved to Sprout.`,
      priority: "high",
      messageTitle: `${approvedCount} pieces passed Creative Director review`,
      messageBody: `Sage scored ${awaiting.length} pieces (avg ${avgAggregateScore}/100).\n${approvedCount} cleared the ${SAGE_PASS_THRESHOLD} threshold and are in the approval queue waiting for a Gate decision.`,
      activityDetail: `Sage handed ${approvedCount} approved pieces to Gate`,
      metadata: { batch_id: batchRow.id, avg_score: avgAggregateScore },
    });
  }
  if (rejectedCount > 0) {
    await recordHandoff({
      fromAgent: "sage",
      toAgent: "bloom",
      workflowName: "Sage → Bloom",
      triggerType: "content_rejected",
      triggerId: batchRow.id,
      taskType: "content_revision",
      taskDescription: `${rejectedCount} pieces scored below ${SAGE_PASS_THRESHOLD} and need a rewrite. Check the Sage review notes (hook + CTA suggestions) before regenerating.`,
      priority: "medium",
      messageTitle: `${rejectedCount} pieces sent back for rework`,
      messageBody: `Sage rejected ${rejectedCount} of ${awaiting.length} pieces this batch. Review the rejection reasons and creative suggestions in the Sage review records, then produce stronger versions.`,
      activityDetail: `Sage sent ${rejectedCount} weak pieces back to Bloom`,
      metadata: { batch_id: batchRow.id },
    });
  }

  await recordAutomationRun({
    ruleKey: "content_ideas",
    agentId: "sage",
    action: "auto_score_content",
    itemsProcessed: awaiting.length,
    itemsCreated: approvedCount,
    detail: `Sage scored ${awaiting.length} pieces — creative scores attached to calendar items`,
    metadata: { batch_id: batchRow.id, avg_score: avgAggregateScore },
  });

  return {
    batchId: batchRow.id,
    piecesReviewed: awaiting.length,
    approvedCount,
    rejectedCount,
    avgAggregateScore,
    approvalQueueCount,
  };
}
