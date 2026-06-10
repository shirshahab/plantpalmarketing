"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  CONTENT_TYPE_LABELS,
  FORMAT_LABELS,
} from "@/lib/creative/framework";
import type { CreativeContentIdea } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-brand-muted">{label}</span>
        <span className="font-semibold text-brand-primary">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-border">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function CreativeIdeaCard({ idea }: { idea: CreativeContentIdea }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{CONTENT_TYPE_LABELS[idea.contentType] ?? idea.contentType}</Badge>
            <Badge>{FORMAT_LABELS[idea.format] ?? idea.format}</Badge>
            <StatusBadge status={idea.status} />
            <span className="text-xs text-brand-muted">{formatDate(idea.createdAt)}</span>
          </div>

          <h3 className="font-heading mt-3 text-lg font-semibold text-brand-primary">
            {idea.title}
          </h3>

          <p className="mt-3 rounded-xl bg-brand-accent/10 px-4 py-3 text-sm font-medium leading-relaxed text-brand-primary">
            {idea.hook}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage">
                Emotional trigger
              </p>
              <p className="mt-1 text-sm capitalize">{idea.emotionalTrigger}</p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage">
                Why it works
              </p>
              <p className="mt-1 text-sm text-brand-muted">{idea.whyItWorks}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-brand-sage/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage">
              Full concept
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
              {idea.body}
            </p>
          </div>

          <p className="mt-3 text-sm">
            <span className="font-semibold text-brand-primary">CTA: </span>
            <span className="text-brand-muted">{idea.cta}</span>
          </p>
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-44">
          <ScoreBar label="Viral score" value={idea.viralScore} max={100} color="bg-brand-accent" />
          <ScoreBar
            label="Difficulty"
            value={idea.difficultyScore}
            max={10}
            color="bg-brand-sage"
          />
          <ApprovalActions
            table="creative_content_ideas"
            id={idea.id}
            initialStatus={idea.status}
          />
          <DeleteButton table="creative_content_ideas" id={idea.id} />
        </div>
      </div>
    </div>
  );
}
