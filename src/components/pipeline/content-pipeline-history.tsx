import type { PipelineHistoryEntry } from "@/lib/pipeline/content-pipeline";
import { formatDate } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  idea_created: "Idea Created",
  approved: "Approved",
  sent_to_bloom: "Sent to Bloom",
  bloom_received: "Bloom Received",
  script_generated: "Script Generated",
  video_generated: "Video Generated",
  published: "Published",
};

export function ContentPipelineHistory({ history }: { history: PipelineHistoryEntry[] }) {
  if (history.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-brand-border/60 bg-brand-bg/40 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-sage">Workflow history</p>
      <ol className="mt-2 space-y-1.5">
        {history.map((entry, i) => (
          <li key={`${entry.stage}-${entry.at}-${i}`} className="flex gap-2 text-xs">
            <span className="shrink-0 text-[10px] text-brand-muted">{formatDate(entry.at)}</span>
            <span className="text-brand-primary">
              {STAGE_LABELS[entry.stage] ?? entry.event}
              {entry.actor ? <span className="text-brand-muted"> · {entry.actor}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
