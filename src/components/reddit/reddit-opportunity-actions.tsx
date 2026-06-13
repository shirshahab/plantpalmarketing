"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveAndPostRedditReply,
  draftRedditReply,
  draftRedditReplyFromIntelligence,
  rejectRedditDraft,
} from "@/lib/actions/reddit";
import { archiveIntelligenceAlertAction } from "@/lib/actions/intelligence-alerts";
import { sendRedditOpportunityToBloomAction } from "@/lib/actions/reddit-opportunity-actions";

export function RedditOpportunityActions({
  opportunityId,
  source,
  draftId,
  configured,
  permalink,
}: {
  opportunityId: string;
  source: "oauth" | "f5bot";
  draftId: string | null;
  configured: boolean;
  permalink?: string;
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
      {permalink && (
        <Link href={permalink} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary">
            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open Source
          </Button>
        </Link>
      )}
      <Link href={permalink ?? `/reddit/opportunity/${opportunityId}?source=${source}`}>
        <Button size="sm" variant="secondary">View Discussion</Button>
      </Link>
      {!draftId && source === "oauth" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => draftRedditReply(opportunityId))}>
          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Draft Reply
        </Button>
      )}
      {!draftId && source === "f5bot" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => draftRedditReplyFromIntelligence(opportunityId))}>
          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Draft Reply
        </Button>
      )}
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => sendRedditOpportunityToBloomAction(opportunityId, source))}>
        Send to Bloom
      </Button>
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
