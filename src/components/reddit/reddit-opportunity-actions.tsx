"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  approveAndPostRedditReply,
  draftRedditReply,
  draftRedditReplyFromIntelligence,
  rejectRedditDraft,
} from "@/lib/actions/reddit";
import { archiveIntelligenceAlertAction } from "@/lib/actions/intelligence-alerts";

export function RedditOpportunityActions({
  opportunityId,
  source,
  draftId,
  configured,
}: {
  opportunityId: string;
  source: "oauth" | "f5bot";
  draftId: string | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!draftId && source === "oauth" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => draftRedditReply(opportunityId))}>
          Draft reply
        </Button>
      )}
      {!draftId && source === "f5bot" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => draftRedditReplyFromIntelligence(opportunityId))}>
          Draft reply
        </Button>
      )}
      {draftId && (
        <Button
          size="sm"
          disabled={pending || !configured}
          onClick={() => run(() => approveAndPostRedditReply(draftId))}
        >
          {configured ? "Approve reply" : "Posting disabled (OAuth required)"}
        </Button>
      )}
      {draftId && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => rejectRedditDraft(draftId, "Not a fit"))}>
          Reject
        </Button>
      )}
      {source === "f5bot" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => archiveIntelligenceAlertAction(opportunityId))}>
          Archive
        </Button>
      )}
    </div>
  );
}
