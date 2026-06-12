"use client";

import { useEffect, useState } from "react";
import { getWorkflowHistory } from "@/lib/actions/workflow";
import { STAGE_BADGE, type WorkflowHistoryEntry, type WorkflowStage } from "@/lib/workflow/types";
import { Badge } from "@/components/ui/badge";

/** Phase 40 — answers: where is it, who owns it, what's next, founder action? */
export function WorkflowStatusStrip({
  sourceTable,
  sourceId,
  stage,
  destinationLabel,
  nextAction,
  currentOwner,
  founderActionRequired,
}: {
  sourceTable?: string;
  sourceId?: string;
  stage?: WorkflowStage | string;
  destinationLabel?: string;
  nextAction?: string;
  currentOwner?: string;
  founderActionRequired?: boolean;
}) {
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([]);

  useEffect(() => {
    if (!sourceTable || !sourceId) return;
    getWorkflowHistory(sourceTable, sourceId).then(setHistory);
  }, [sourceTable, sourceId]);

  const badge = stage ? STAGE_BADGE[stage as WorkflowStage] ?? "In Production" : null;
  const lastDest = history.length > 0 ? history[history.length - 1]?.destination : undefined;
  const strip = destinationLabel || lastDest;

  if (!stage && !strip && history.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-brand-border/60 bg-brand-bg/50 px-2.5 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {badge && <Badge variant={founderActionRequired ? "warning" : "info"}>{badge}</Badge>}
        {strip && (
          <span className="font-medium text-brand-primary">{strip}</span>
        )}
      </div>
      <dl className="mt-1.5 grid gap-1 sm:grid-cols-2">
        {currentOwner && (
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-brand-muted">Owner</dt>
            <dd className="text-brand-primary">{currentOwner === "founder" ? "Waiting on you" : currentOwner}</dd>
          </div>
        )}
        {nextAction && (
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-brand-muted">Next</dt>
            <dd className="text-brand-primary">{nextAction}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-brand-muted">Founder action</dt>
          <dd className={founderActionRequired ? "font-semibold text-amber-700" : "text-brand-muted"}>
            {founderActionRequired ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
