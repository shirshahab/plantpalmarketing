import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapBloomContentPerformance,
  mapBloomContentPiece,
  mapBloomProductionRun,
} from "@/lib/supabase/mappers";
import type { BloomContentFormat, BloomPieceStatus } from "@/lib/types";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getBloomContentPieces(filters?: {
  format?: BloomContentFormat;
  status?: BloomPieceStatus;
  limit?: number;
}) {
  const supabase = createServerClient();
  let query = supabase.from("bloom_content_pieces").select("*").order("created_at", { ascending: false });
  if (filters?.format) query = query.eq("format", filters.format);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBloomContentPiece);
}

export async function getBloomCalendarPieces() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bloom_content_pieces")
    .select("*")
    .not("scheduled_date", "is", null)
    .order("scheduled_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBloomContentPiece);
}

export async function getBloomDraftQueue() {
  return getBloomContentPieces({ status: "pending" });
}

export async function getBloomProductionRuns(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bloom_production_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBloomProductionRun);
}

export async function getLatestBloomRun() {
  const runs = await getBloomProductionRuns(1);
  return runs[0] ?? null;
}

export async function getBloomPerformance() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bloom_content_performance")
    .select("*")
    .order("tracked_at", { ascending: false });
  if (error) throw new Error(error.message);

  const pieceIds = [...new Set((data ?? []).map((r) => r.content_piece_id))];
  let pieceMap = new Map<string, ReturnType<typeof mapBloomContentPiece>>();

  if (pieceIds.length > 0) {
    const { data: pieces } = await supabase
      .from("bloom_content_pieces")
      .select("*")
      .in("id", pieceIds);
    pieceMap = new Map((pieces ?? []).map((p) => [p.id, mapBloomContentPiece(p)]));
  }

  return (data ?? []).map((row) =>
    mapBloomContentPerformance(row, pieceMap.get(row.content_piece_id))
  );
}

export async function getBloomActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "bloom")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getBloomStats() {
  const supabase = createServerClient();
  const today = todayStart();
  const [generatedToday, pendingQueue, awaitingReview, published, highViral, latestRun] = await Promise.all([
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).eq("status", "awaiting_review"),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).gte("viral_score", 75),
    getLatestBloomRun(),
  ]);

  const totalPieces = (await supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true })).count ?? 0;

  return {
    generatedToday: generatedToday.count ?? 0,
    pendingQueue: pendingQueue.count ?? 0,
    awaitingReview: awaitingReview.count ?? 0,
    publishedCount: published.count ?? 0,
    highViralCount: highViral.count ?? 0,
    totalPieces,
    latestRun,
  };
}

export async function getBloomHQData() {
  const [bloomStats, bloomActivity, recentPieces, draftQueue, latestRun] = await Promise.all([
    getBloomStats(),
    getBloomActivity(8),
    getBloomContentPieces({ limit: 6 }),
    getBloomDraftQueue().then((d) => d.slice(0, 5)),
    getLatestBloomRun(),
  ]);
  return { bloomStats, bloomActivity, recentPieces, draftQueue, latestRun };
}
