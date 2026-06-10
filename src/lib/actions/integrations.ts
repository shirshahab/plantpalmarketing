"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runAllHealthChecks, runProviderHealthCheck } from "@/lib/integrations/health";
import { syncXData, publishApprovedXTweet, draftXTweet, advanceXQueueStatus } from "@/lib/integrations/x-service";
import type { IntegrationProvider } from "@/lib/integrations/types";

export type IntegrationActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function testIntegrationConnection(
  provider: IntegrationProvider
): Promise<IntegrationActionResult & { status?: string }> {
  try {
    const result = await runProviderHealthCheck(provider);
    await revalidateDashboard();
    return { ok: true, message: result.message, status: result.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Health check failed" };
  }
}

export async function runAllIntegrationHealthChecks(): Promise<
  IntegrationActionResult & { results?: { provider: string; status: string; message: string }[] }
> {
  try {
    const results = await runAllHealthChecks();
    await revalidateDashboard();
    return {
      ok: true,
      message: `Checked ${results.length} providers`,
      results: results.map((r) => ({ provider: r.provider, status: r.status, message: r.message })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Health checks failed" };
  }
}

export async function syncXIntegration(): Promise<IntegrationActionResult> {
  try {
    const { metrics, tweets } = await syncXData("manual_sync");
    await revalidateDashboard();
    return {
      ok: true,
      message: metrics
        ? `Synced @${metrics.username} — ${metrics.followerCount} followers, ${tweets.length} tweets`
        : "X read not configured — showing cached data",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "X sync failed" };
  }
}

export async function createXDraft(text: string): Promise<IntegrationActionResult & { id?: string }> {
  try {
    const id = await draftXTweet(text, { agentId: "manual" });
    await revalidateDashboard();
    return { ok: true, message: "Draft created", id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed" };
  }
}

export async function approveXForGate(queueId: string): Promise<IntegrationActionResult> {
  try {
    await advanceXQueueStatus(queueId, "gate_approval", { sageApproved: true });
    await revalidateDashboard();
    return { ok: true, message: "Sent to Gate for human approval" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approval step failed" };
  }
}

export async function gateApproveXPost(queueId: string): Promise<IntegrationActionResult> {
  try {
    await advanceXQueueStatus(queueId, "queued", { gateApproved: true, scheduledAt: new Date().toISOString() });
    await revalidateDashboard();
    return { ok: true, message: "Gate approved — queued for Sprout publish (human must confirm publish)" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gate approval failed" };
  }
}

export async function publishXPost(queueId: string): Promise<IntegrationActionResult & { tweetId?: string }> {
  try {
    const { tweetId } = await publishApprovedXTweet(queueId, "sprout");
    await revalidateDashboard();
    return { ok: true, message: `Published tweet ${tweetId}`, tweetId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Publish failed" };
  }
}

export async function rejectXPost(queueId: string): Promise<IntegrationActionResult> {
  try {
    await advanceXQueueStatus(queueId, "rejected");
    await revalidateDashboard();
    return { ok: true, message: "Post rejected" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reject failed" };
  }
}
