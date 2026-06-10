"use client";

import { ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import type { AgentEvent } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const EVENT_LABELS: Record<string, string> = {
  scout_found_creator: "Creator found",
  roots_found_discussion: "Discussion found",
  sentinel_detected_feature: "Competitor alert",
  bloom_generated_content: "Content generated",
  sage_rejected_content: "Content rejected",
  sage_approved_content: "Content approved",
  gate_approved_content: "Approved",
  gate_rejected_content: "Rejected",
  oak_created_partnership: "Partnership",
  ivy_executive_brief: "Executive brief",
  atlas_growth_insight: "Growth insight",
  fern_acquisition_opportunity: "Acquisition",
  echo_voc_insight: "VoC insight",
  agent_message_sent: "Message sent",
  agent_task_assigned: "Task assigned",
  agent_task_completed: "Task completed",
};

export function ActivityStream({ events }: { events: AgentEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-brand-muted">No events in the activity stream yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-xl border border-brand-border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{EVENT_LABELS[event.eventType] ?? event.eventType}</Badge>
            <span className="text-xs font-medium text-brand-primary">
              {AGENT_SLUG_LABELS[event.sourceAgent]}
            </span>
            {event.targetAgent && (
              <>
                <ArrowRight className="h-3 w-3 text-brand-sage" />
                <span className="text-xs text-brand-muted">{AGENT_SLUG_LABELS[event.targetAgent]}</span>
              </>
            )}
            <span className="ml-auto text-[10px] text-brand-sage">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 font-medium text-brand-primary">{event.title}</p>
          <p className="mt-1 text-sm text-brand-muted">{event.summary}</p>
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-brand-bg/60 px-3 py-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-xs text-brand-primary"><span className="font-medium">Impact: </span>{event.impact}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
