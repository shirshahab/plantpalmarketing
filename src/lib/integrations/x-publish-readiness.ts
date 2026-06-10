import { createServerClient } from "@/lib/supabase/server";
import {
  getXPublishCredentialStatus,
  isXPublishConfigured,
} from "@/lib/integrations/config";
import type { XPostQueueStatus } from "@/lib/integrations/types";

export const X_TWEET_MAX_LENGTH = 280;

export interface XPublishEligibility {
  ok: boolean;
  reasons: string[];
  credentials: ReturnType<typeof getXPublishCredentialStatus>;
}

export interface XPublishValidation {
  ok: boolean;
  errors: string[];
  normalizedText?: string;
}

export function validateTweetContent(text: string): XPublishValidation {
  const normalized = text.trim();
  if (!normalized) {
    return { ok: false, errors: ["Tweet text cannot be empty"] };
  }
  if (normalized.length > X_TWEET_MAX_LENGTH) {
    return {
      ok: false,
      errors: [`Tweet exceeds ${X_TWEET_MAX_LENGTH} characters (${normalized.length})`],
    };
  }
  return { ok: true, errors: [], normalizedText: normalized };
}

export function checkXPublishEligibility(opts: {
  sageApproved: boolean;
  gateApproved: boolean;
  status: XPostQueueStatus;
  publishedTweetId: string | null;
}): XPublishEligibility {
  const credentials = getXPublishCredentialStatus();
  const reasons: string[] = [];

  if (!opts.sageApproved) reasons.push("Sage approval required");
  if (!opts.gateApproved) reasons.push("Gate approval required");
  if (!["ready_to_publish", "queued"].includes(opts.status)) {
    reasons.push(`Post must be Ready to Publish (current: ${opts.status})`);
  }
  if (opts.publishedTweetId) reasons.push("Already published");
  if (!credentials.publishConnected) {
    reasons.push(
      `X publish credentials missing: ${credentials.missingPublishVars.join(", ") || "OAuth tokens"}`
    );
  }

  return { ok: reasons.length === 0, reasons, credentials };
}

export async function assertNoDuplicatePublish(
  queueId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerClient();
  const normalized = text.trim().toLowerCase();

  const { data: sameQueue } = await supabase
    .from("x_post_queue")
    .select("id, published_tweet_id")
    .eq("id", queueId)
    .maybeSingle();

  if (sameQueue?.published_tweet_id) {
    return { ok: false, error: "This queue item already has a published_tweet_id" };
  }

  const { data: dupPublished } = await supabase
    .from("x_post_queue")
    .select("id")
    .eq("status", "published")
    .ilike("text", text.trim())
    .neq("id", queueId)
    .limit(1);

  if ((dupPublished ?? []).length > 0) {
    return { ok: false, error: "Duplicate blocked — same text already published from queue" };
  }

  const { data: dupPosts } = await supabase
    .from("x_posts")
    .select("tweet_id")
    .ilike("text", text.trim())
    .limit(1);

  if ((dupPosts ?? []).length > 0) {
    return { ok: false, error: "Duplicate blocked — same text already exists in x_posts" };
  }

  if (!normalized) {
    return { ok: false, error: "Empty tweet text" };
  }

  return { ok: true };
}

export function isXPublishReady(): boolean {
  return isXPublishConfigured();
}
