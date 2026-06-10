import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapBloomContentPiece,
  mapSageContentReview,
  mapSageReviewBatch,
} from "@/lib/supabase/mappers";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getSageReviews() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sage_content_reviews")
    .select("*")
    .order("aggregate_score", { ascending: false });
  if (error) throw new Error(error.message);

  const pieceIds = [...new Set((data ?? []).map((r) => r.bloom_piece_id))];
  let pieceMap = new Map<string, ReturnType<typeof mapBloomContentPiece>>();

  if (pieceIds.length > 0) {
    const { data: pieces } = await supabase.from("bloom_content_pieces").select("*").in("id", pieceIds);
    pieceMap = new Map((pieces ?? []).map((p) => [p.id, mapBloomContentPiece(p)]));
  }

  return (data ?? []).map((row) => mapSageContentReview(row, pieceMap.get(row.bloom_piece_id)));
}

export async function getSageApprovalRecommendations() {
  const reviews = await getSageReviews();
  return reviews.filter((r) => r.recommendation === "approve");
}

export async function getSageRejections() {
  const reviews = await getSageReviews();
  return reviews.filter((r) => r.recommendation === "reject");
}

export async function getSageCreativeOpportunities() {
  const reviews = await getSageReviews();
  return reviews.filter((r) => r.creativeOpportunity.length > 0);
}

export async function getSageReviewBatches(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sage_review_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSageReviewBatch);
}

export async function getLatestSageBatch() {
  const batches = await getSageReviewBatches(1);
  return batches[0] ?? null;
}

export async function getSageActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "sage")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getSageStats() {
  const supabase = createServerClient();
  const today = todayStart();
  const [reviewedToday, approved, rejected, awaitingReview, avgScore] = await Promise.all([
    supabase.from("sage_content_reviews").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("sage_content_reviews").select("*", { count: "exact", head: true }).eq("recommendation", "approve"),
    supabase.from("sage_content_reviews").select("*", { count: "exact", head: true }).eq("recommendation", "reject"),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).eq("status", "awaiting_review"),
    supabase.from("sage_content_reviews").select("aggregate_score"),
  ]);

  const scores = (avgScore.data ?? []).map((r) => r.aggregate_score as number);
  const avgAggregate =
    scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return {
    reviewedToday: reviewedToday.count ?? 0,
    approvedCount: approved.count ?? 0,
    rejectedCount: rejected.count ?? 0,
    awaitingReview: awaitingReview.count ?? 0,
    avgAggregateScore: avgAggregate,
    totalReviews: scores.length,
    latestBatch: await getLatestSageBatch(),
  };
}

export async function getSageHQData() {
  const [sageStats, sageActivity, recentReviews, rejections, opportunities] = await Promise.all([
    getSageStats(),
    getSageActivity(8),
    getSageReviews().then((r) => r.slice(0, 6)),
    getSageRejections().then((r) => r.slice(0, 4)),
    getSageCreativeOpportunities().then((r) => r.slice(0, 4)),
  ]);
  return { sageStats, sageActivity, recentReviews, rejections, opportunities };
}
