import { getFounderInbox } from "@/lib/workflow/inbox-queries";
import type { PipelineHealth, SystemPipelineStatus } from "@/lib/pipeline/system-health";

export async function getActionLinkAudit(): Promise<SystemPipelineStatus> {
  const issues: string[] = [];

  try {
    const inbox = await getFounderInbox();

    if (inbox.tabCounts.all === 0 && inbox.totalPending > 0) {
      issues.push("Tab counts mismatch with attention items");
    }

    const intelMissingUrl = inbox.intelligence.filter((i) => !i.sourceUrl).length;
    if (intelMissingUrl > 0) {
      issues.push(`${intelMissingUrl} intelligence items missing source URL`);
    }

    const brokenHrefs = inbox.attentionItems.filter(
      (i) => i.href.includes("/intelligence/reddit") || i.href.includes("undefined")
    );
    if (brokenHrefs.length > 0) {
      issues.push(`${brokenHrefs.length} items link to missing routes`);
    }

    if (inbox.tabCounts.replies === 0 && inbox.replies.length > 0) {
      issues.push("Replies tab not counting reply items");
    }
  } catch (e) {
    issues.push(e instanceof Error ? e.message : "Could not load Founder Inbox");
  }

  const status: PipelineHealth = issues.length === 0 ? "healthy" : "broken";

  return {
    id: "action-link-audit",
    label: "Action Link Audit",
    flow: "Draft Reply modal, Send to Bloom, Open Source URLs, Need You badge, Inbox tabs",
    status,
    waiting: issues.length,
    lastSuccess: status === "healthy" ? new Date().toISOString() : null,
    lastFailure: status === "broken" ? new Date().toISOString() : null,
    failureReason: issues.length > 0 ? issues.join("; ") : null,
  };
}
