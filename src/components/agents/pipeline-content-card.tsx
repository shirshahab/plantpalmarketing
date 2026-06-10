"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStatusBadge } from "@/components/agents/pipeline-status-badge";
import { ScoreBars } from "@/components/agents/score-bars";
import { updatePipelineStatus } from "@/lib/actions/agent-pipeline";
import type { PipelineContent } from "@/lib/types";

function formatLabel(format: string) {
  return format.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PipelineContentCard({
  item,
  showActions = false,
}: {
  item: PipelineContent;
  showActions?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStatus(status: "approved" | "rejected") {
    startTransition(async () => {
      await updatePipelineStatus(item.id, status);
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{item.platform}</Badge>
          <Badge variant="muted">{formatLabel(item.format)}</Badge>
          <PipelineStatusBadge status={item.status} />
        </div>
        <div className="text-right text-xs text-brand-muted">
          <div>Viral: <span className="font-semibold text-brand-primary">{item.viralScore}</span></div>
          {item.rewriteCount > 0 && <div>{item.rewriteCount} rewrite{item.rewriteCount > 1 ? "s" : ""}</div>}
        </div>
      </div>

      <p className="mt-4 font-heading text-base font-semibold text-brand-primary">{item.hook}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{item.caption}</p>
      <p className="mt-3 text-sm">
        <span className="font-medium text-brand-muted">CTA:</span> {item.cta}
      </p>

      {item.directorNotes && (
        <p className="mt-3 rounded-lg bg-brand-primary/5 px-3 py-2 text-xs text-brand-muted">
          <span className="font-medium text-brand-primary">Director:</span> {item.directorNotes}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ScoreBars item={item} />
      </div>

      {showActions && item.status === "pending_review" && (
        <div className="mt-4 flex gap-2 border-t border-brand-primary/10 pt-4">
          <Button size="sm" disabled={pending} onClick={() => handleStatus("approved")}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleStatus("rejected")}>
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
