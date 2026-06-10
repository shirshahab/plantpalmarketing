"use client";

import { X, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { ApprovalFeedItem } from "@/components/hq/approval-feed-item";
import { ScoutRootsAgentDetail } from "@/components/hq/scout-roots-detail";
import { SentinelAgentDetail } from "@/components/hq/sentinel-detail";
import { BloomAgentDetail } from "@/components/hq/bloom-detail";
import { SageAgentDetail } from "@/components/hq/sage-detail";
import { SproutAgentDetail } from "@/components/hq/sprout-detail";
import { OakAgentDetail } from "@/components/hq/oak-detail";
import { IvyAgentDetail } from "@/components/hq/ivy-detail";
import { AtlasAgentDetail } from "@/components/hq/atlas-detail";
import { FernAgentDetail } from "@/components/hq/fern-detail";
import { EchoAgentDetail } from "@/components/hq/echo-detail";
import type { ActivityItem, HQAgent } from "@/lib/hq/types";

export function AgentDetailDrawer({
  agent,
  relatedActivity,
  onClose,
  onApprove,
  onEdit,
  onReject,
}: {
  agent: HQAgent | null;
  relatedActivity: ActivityItem | null;
  onClose: () => void;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}) {
  if (!agent) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-brand-primary/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-brand-border bg-white shadow-2xl sm:top-16">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Agent Detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {agent.id === "chief_of_staff" ? (
            <IvyAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "growth" ? (
            <AtlasAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "acquisition" ? (
            <FernAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "customer_voice" ? (
            <EchoAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "publishing" ? (
            <SproutAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "partnerships" ? (
            <OakAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "competitor" ? (
            <SentinelAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "content" ? (
            <BloomAgentDetail agent={agent} onClose={onClose} />
          ) : agent.id === "creative_director" ? (
            <SageAgentDetail agent={agent} onClose={onClose} />
          ) : (agent.id === "creator" || agent.id === "community") ? (
            <ScoutRootsAgentDetail agent={agent} onClose={onClose} />
          ) : (
          <>
          <div className="flex items-start gap-4">
            <AgentCharacter agent={agent} floatDelay="" isActive />
            <div>
              <p className="font-heading text-xl font-bold text-brand-primary">{agent.name}</p>
              <p className="text-sm text-brand-muted">{agent.role}</p>
              <p className="mt-1 text-xs text-brand-sage">{agent.station}</p>
              <div className="mt-2">
                <AgentStatusBadge status={agent.status} />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">
                Current task
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-800">{agent.currentTask}</p>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">
                Progress
              </h3>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
                <div
                  className="h-full rounded-full bg-brand-accent transition-all"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-brand-muted">{agent.progress}% complete</p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
                <p className="text-xs text-brand-muted">Items created</p>
                <p className="font-heading text-2xl font-bold text-brand-primary">
                  {agent.itemsCreated}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
                <p className="text-xs text-brand-muted">Needs review</p>
                <p className="font-heading text-2xl font-bold text-brand-primary">
                  {agent.itemsNeedingReview}
                </p>
              </div>
            </div>

            <p className="text-xs text-brand-sage">Last updated {agent.lastUpdate}</p>
          </div>

          {relatedActivity && (
            <div className="mt-8 rounded-2xl border border-brand-border bg-brand-bg/30 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">
                Related activity
              </h3>
              <p className="mt-2 font-heading text-sm font-semibold text-brand-primary">
                {relatedActivity.title}
              </p>
              <p className="mt-1 text-xs text-brand-muted">{relatedActivity.summary}</p>
              {relatedActivity.draft && (
                <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-relaxed text-gray-700">
                  {relatedActivity.draft}
                </pre>
              )}
              {relatedActivity.type === "approval_needed" && relatedActivity.status === "pending" && onApprove && (
                <div className="mt-4">
                  <ApprovalFeedItem
                    item={relatedActivity}
                    onApprove={onApprove}
                    onEdit={onEdit ?? onApprove}
                    onReject={onReject ?? onApprove}
                  />
                </div>
              )}
            </div>
          )}
          </>
          )}
        </div>

        {agent.id !== "creator" && agent.id !== "community" && agent.id !== "competitor" && (
          <div className="border-t border-brand-border p-4">
            <Button variant="secondary" className="w-full" onClick={onClose}>
              Close panel
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

export function ActivityDetailDrawer({
  activity,
  onClose,
  onApprove,
  onEdit,
  onReject,
}: {
  activity: ActivityItem | null;
  onClose: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  if (!activity) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-brand-primary/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-brand-border bg-white shadow-2xl sm:top-16">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Review Item</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-sage">
            {activity.type.replace(/_/g, " ")}
          </p>
          <h3 className="mt-1 font-heading text-lg font-bold text-brand-primary">{activity.title}</h3>
          <p className="mt-2 text-sm text-brand-muted">{activity.summary}</p>
          <p className="mt-2 text-xs text-brand-sage">{activity.timestamp}</p>

          {activity.draft && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Draft</h4>
              <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-brand-border bg-brand-bg/50 p-4 text-sm leading-relaxed text-gray-800">
                {activity.draft}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-brand-border p-4">
          {(activity.type === "approval_needed" || activity.type === "reply_awaiting_approval") && activity.status === "pending" ? (
            <ApprovalFeedItem
              item={activity}
              onApprove={onApprove}
              onEdit={onEdit}
              onReject={onReject}
            />
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Open in editor
              </Button>
              <Button variant="primary" className="flex-1" onClick={onClose}>
                <Check className="h-4 w-4" />
                Done
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
