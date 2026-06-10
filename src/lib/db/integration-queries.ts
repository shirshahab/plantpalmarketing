import { createServerClient } from "@/lib/supabase";
import {
  mapIntegrationLog,
  mapIntegrationStatus,
  mapXAccountSnapshot,
  mapXPost,
  mapXPostQueueItem,
} from "@/lib/supabase/mappers";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getXPublishCredentialStatus } from "@/lib/integrations/config";
import { getIntegrationStatuses } from "@/lib/integrations/status-service";
import type { IntegrationProvider } from "@/lib/integrations/types";

export async function getIntegrationsDashboard() {
  const [statuses, logs] = await Promise.all([
    getIntegrationStatuses(),
    getIntegrationLogs().catch(() => [] as Awaited<ReturnType<typeof getIntegrationLogs>>),
  ]);
  return { statuses, logs };
}

export async function getIntegrationLogs(provider?: IntegrationProvider, limit = 30) {
  const supabase = createServerClient();
  let q = supabase
    .from("integration_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (provider) q = q.eq("provider", provider);
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapIntegrationLog);
}

export async function getProviderStatusesFromDb() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("integration_status").select("*");
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapIntegrationStatus);
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (isMissingTableError({ message: msg })) return fallback;
    throw e;
  }
}

export async function getLatestXSnapshot() {
  return safeQuery(async () => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("x_account_snapshots")
      .select("*")
      .order("snapshot_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? mapXAccountSnapshot(data) : null;
  }, null);
}

export async function getXPosts(limit = 20) {
  return safeQuery(async () => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("x_posts")
      .select("*")
      .order("posted_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map(mapXPost);
  }, []);
}

export async function getTopXPosts(limit = 5) {
  return safeQuery(async () => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("x_posts")
      .select("*")
      .order("like_count", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map(mapXPost);
  }, []);
}

export async function getXPostQueue(status?: string) {
  return safeQuery(async () => {
    const supabase = createServerClient();
    let q = supabase.from("x_post_queue").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map(mapXPostQueueItem);
  }, []);
}

export async function getXDashboardData() {
  const [snapshot, recentPosts, topPosts, allQueue, drafts, sageQueue, gateQueue, readyQueue, legacyQueued] =
    await Promise.all([
      getLatestXSnapshot(),
      getXPosts(10),
      getTopXPosts(5),
      getXPostQueue(),
      getXPostQueue("draft"),
      getXPostQueue("sage_review"),
      getXPostQueue("gate_approval"),
      getXPostQueue("ready_to_publish"),
      getXPostQueue("queued"),
    ]);

  const seen = new Set<string>();
  const publishQueue = [...readyQueue, ...legacyQueued.filter((q) => q.gateApproved && q.sageApproved)].filter(
    (q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    }
  );

  const engagement = recentPosts.reduce(
    (acc, p) => acc + p.likeCount + p.retweetCount + p.replyCount,
    0
  );

  return {
    snapshot,
    recentPosts,
    topPosts,
    allQueue,
    drafts,
    gateQueue,
    publishQueue,
    sageQueue,
    publishCredentials: getXPublishCredentialStatus(),
    stats: {
      followerCount: snapshot?.followerCount ?? 0,
      engagement,
      draftCount: drafts.length,
      sageCount: sageQueue.length,
      approvalCount: gateQueue.length,
      readyCount: publishQueue.length,
      queuedCount: publishQueue.length,
      publishedCount: allQueue.filter((q) => q.status === "published").length,
    },
  };
}
