"use client";

import { useEffect, useState } from "react";
import { getWorkflowHistory } from "@/lib/actions/workflow";
import type { WorkflowHistoryEntry } from "@/lib/workflow/types";
import { formatDate } from "@/lib/utils";

/**
 * Phase 39 — workflow history panel on every content item.
 */
export function WorkflowHistoryPanel({
  sourceTable,
  sourceId,
}: {
  sourceTable: string;
  sourceId: string;
}) {
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWorkflowHistory(sourceTable, sourceId).then((entries) => {
      if (!cancelled) {
        setHistory(entries);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sourceTable, sourceId]);

  if (!loaded) return null;
  if (history.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-brand-border/60 bg-brand-bg/40 p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-sage">Workflow history</p>
      <ol className="mt-2 space-y-1.5">
        {history.map((entry, i) => (
          <li key={`${entry.at}-${i}`} className="flex gap-2 text-xs">
            <span className="shrink-0 text-[10px] text-brand-muted">{formatDate(entry.at)}</span>
            <span className="text-brand-primary">
              {entry.event}
              {entry.agent ? <span className="text-brand-muted"> · {entry.agent}</span> : null}
              {entry.note ? <span className="mt-0.5 block text-[11px] text-brand-muted">{entry.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
