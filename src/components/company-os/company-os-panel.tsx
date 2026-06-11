"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CompanyOsPageData,
  CompanyWorkflowRow,
} from "@/lib/db/company-os-queries";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  in_progress: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
  skipped: "bg-slate-100 text-slate-600",
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
  critical: "bg-red-100 text-red-800",
};

const TYPE_LABEL: Record<string, string> = {
  creator_partnership: "Creator Partnership",
  community_response: "Community Response",
  content_creation: "Content Creation",
  creative_asset: "Creative Asset",
  publishing: "Publishing",
  seo_blog: "SEO Blog",
  reddit_reply: "Reddit Reply",
  competitor_response: "Competitor Response",
  growth_experiment: "Growth Experiment",
  daily_report: "Daily Report",
  system_health: "System Health",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[value] ?? "bg-slate-100 text-slate-600"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function AgentChip({ agent }: { agent: string }) {
  if (!agent) return null;
  return (
    <span className="rounded-md bg-brand-primary/5 px-1.5 py-0.5 text-xs font-medium capitalize text-brand-primary">
      {agent.replace(/_/g, " ")}
    </span>
  );
}

function WorkflowRow({
  workflow,
  onClick,
}: {
  workflow: CompanyWorkflowRow;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-brand-border p-3 text-left transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-primary">
            {workflow.workflowName || TYPE_LABEL[workflow.workflowType] || workflow.workflowType}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-brand-muted">
            <span>{TYPE_LABEL[workflow.workflowType] ?? workflow.workflowType}</span>
            <span>·</span>
            <AgentChip agent={workflow.currentAgent} />
            {workflow.nextAgent && (
              <>
                <span>→</span>
                <AgentChip agent={workflow.nextAgent} />
              </>
            )}
            <span>· {timeAgo(workflow.startedAt)}</span>
          </p>
          {workflow.blockerReason && (
            <p className="mt-1 text-xs text-red-600">{workflow.blockerReason}</p>
          )}
        </div>
        <StatusPill value={workflow.status} />
      </div>
    </button>
  );
}

function WorkflowDrawer({
  workflow,
  onClose,
  data,
}: {
  workflow: CompanyWorkflowRow;
  onClose: () => void;
  data: CompanyOsPageData;
}) {
  const outputs = data.outputs.filter((o) => o.workflowId === workflow.id);
  const decisions = data.decisions.filter((d) => d.workflowId === workflow.id);
  const bottlenecks = data.bottlenecks.filter((b) => b.workflowId === workflow.id);
  const agents = Array.from(new Set(workflow.steps.map((s) => s.agentId).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-muted">
              {TYPE_LABEL[workflow.workflowType] ?? workflow.workflowType}
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-brand-primary">
              {workflow.workflowName || "Workflow"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-2.5 py-1 text-sm text-brand-muted hover:bg-brand-primary/5"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill value={workflow.status} />
          <span className="text-xs text-brand-muted">Started {timeAgo(workflow.startedAt)}</span>
          {workflow.completedAt && (
            <span className="text-xs text-brand-muted">· Completed {timeAgo(workflow.completedAt)}</span>
          )}
          <span className="text-xs text-brand-muted">· Impact {workflow.impactScore}/100</span>
        </div>

        {workflow.blockerReason && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Blocked: {workflow.blockerReason}
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-primary">Next step</h3>
          <p className="mt-1 text-sm text-brand-muted">
            {workflow.status === "completed"
              ? workflow.outcome || "Workflow completed."
              : workflow.nextAgent
                ? `Hand off to ${workflow.nextAgent.replace(/_/g, " ")} once ${workflow.currentAgent || "the current agent"} finishes.`
                : `${workflow.currentAgent || "Current agent"} is the final stop. Complete or publish.`}
          </p>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-primary">Agents involved</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agents.length === 0 ? (
              <p className="text-sm text-brand-muted">No steps recorded yet.</p>
            ) : (
              agents.map((a) => <AgentChip key={a} agent={a} />)
            )}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand-primary">Timeline</h3>
          {workflow.steps.length === 0 ? (
            <p className="mt-1 text-sm text-brand-muted">No steps recorded yet.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {workflow.steps.map((step) => (
                <li key={step.id} className="rounded-xl border border-brand-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-brand-primary">
                      {step.stepOrder}. {step.stepName || step.agentId}
                    </p>
                    <StatusPill value={step.status} />
                  </div>
                  <p className="mt-1 text-xs text-brand-muted">
                    {timeAgo(step.startedAt)}
                    {step.completedAt ? ` → done ${timeAgo(step.completedAt)}` : ""}
                  </p>
                  {step.inputSummary && (
                    <p className="mt-1 text-xs text-brand-muted">In: {step.inputSummary}</p>
                  )}
                  {step.outputSummary && (
                    <p className="mt-1 text-xs text-brand-muted">Out: {step.outputSummary}</p>
                  )}
                  {step.blockerReason && (
                    <p className="mt-1 text-xs text-red-600">Blocked: {step.blockerReason}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {outputs.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-brand-primary">Outputs</h3>
            <div className="mt-2 space-y-2">
              {outputs.map((o) => (
                <div key={o.id} className="rounded-xl border border-brand-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-brand-primary">{o.title}</p>
                    <StatusPill value={o.status} />
                  </div>
                  <p className="mt-1 text-xs text-brand-muted">
                    {o.outputType.replace(/_/g, " ")} by {o.agentId} · {timeAgo(o.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {decisions.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-brand-primary">Decisions</h3>
            <div className="mt-2 space-y-2">
              {decisions.map((d) => (
                <div key={d.id} className="rounded-xl border border-brand-border p-3">
                  <p className="text-sm font-medium capitalize text-brand-primary">
                    {d.decision.replace(/_/g, " ")} · {d.decisionMaker}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {d.reason}
                    {d.feedback ? ` — "${d.feedback}"` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {bottlenecks.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-brand-primary">Blockers</h3>
            <div className="mt-2 space-y-2">
              {bottlenecks.map((b) => (
                <div key={b.id} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <p className="text-sm text-red-700">{b.description}</p>
                  {b.recommendedFix && (
                    <p className="mt-1 text-xs text-brand-muted">Fix: {b.recommendedFix}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Match a Workflow Health label like "Scout → Oak" (or a workflow id/name
 * fragment) to a recorded Company OS workflow.
 */
function findWorkflowByQuery(data: CompanyOsPageData, query: string): CompanyWorkflowRow | null {
  const all = [...data.activeWorkflows, ...data.blockedWorkflows, ...data.completedWorkflows];
  if (all.length === 0) return null;

  const byId = all.find((w) => w.id === query);
  if (byId) return byId;

  const tokens = query
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (tokens.length === 0) return null;

  return (
    all.find((w) => {
      const haystack = [
        w.workflowName,
        w.workflowType,
        w.sourceAgent,
        w.currentAgent,
        w.nextAgent,
        ...w.steps.map((s) => `${s.agentId} ${s.stepName}`),
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    }) ?? null
  );
}

export function CompanyOsPanel({
  data,
  workflowQuery,
}: {
  data: CompanyOsPageData;
  workflowQuery?: string;
}) {
  const [selected, setSelected] = useState<CompanyWorkflowRow | null>(null);
  const [queryMissed, setQueryMissed] = useState(false);

  // Phase 33 — deep link: /company-os?workflow=Scout → Oak opens the drawer.
  useEffect(() => {
    if (!workflowQuery) return;
    const match = findWorkflowByQuery(data, workflowQuery);
    if (match) {
      setSelected(match);
    } else {
      setQueryMissed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowQuery]);

  const { summary } = data;
  const scoreColor =
    summary.healthScore >= 80 ? "text-emerald-600" : summary.healthScore >= 50 ? "text-amber-600" : "text-red-600";

  if (data.tablesMissing) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm font-medium text-brand-primary">Company OS is setting up.</p>
          <p className="mt-1 text-sm text-brand-muted">
            System setup is still finishing. This section will populate once the backend is ready.
            Workflows start recording automatically the next time any agent hands off work.
          </p>
          <a href="/admin/setup-health" className="mt-2 inline-block text-xs font-medium text-brand-accent hover:underline">
            Admin: view setup health →
          </a>
        </CardContent>
      </Card>
    );
  }

  const openBottlenecks = data.bottlenecks.filter((b) => b.status === "open");

  return (
    <div className="space-y-6">
      {queryMissed && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-brand-muted">
              No detailed workflow records yet for this handoff. Future handoffs will be tracked here.
            </p>
          </CardContent>
        </Card>
      )}
      {/* 9. Company Health Score + operating stats */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <p className={`text-5xl font-bold ${scoreColor}`}>{summary.healthScore}</p>
              <p className="mt-1 text-sm text-brand-muted">Company health score</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
              <Stat label="Started today" value={summary.workflowsStartedToday} />
              <Stat label="Completed today" value={summary.workflowsCompletedToday} />
              <Stat label="Active now" value={summary.activeWorkflows} />
              <Stat label="Blocked" value={summary.blockedWorkflows} alert={summary.blockedWorkflows > 0} />
              <Stat label="Decisions needed" value={summary.decisionsNeeded} alert={summary.decisionsNeeded > 0} />
              <Stat label="Outputs today" value={summary.outputsToday} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. Workflow Map */}
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Workflow map</h3>
          <p className="mt-1 text-xs text-brand-muted">Standard pipelines and how much work is moving through each.</p>
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {data.workflowMap.map((entry) => (
              <div key={entry.workflowType} className="rounded-xl border border-brand-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-brand-primary">
                    {TYPE_LABEL[entry.workflowType] ?? entry.workflowType}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {entry.active} active · {entry.completed} done
                    {entry.blocked > 0 ? ` · ${entry.blocked} blocked` : ""}
                  </p>
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-brand-muted">
                  {entry.pipeline.map((agent, i) => (
                    <span key={`${agent}-${i}`} className="flex items-center gap-1">
                      <AgentChip agent={agent} />
                      {i < entry.pipeline.length - 1 && <span>→</span>}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 1. Active Workflows */}
        <WorkflowSection
          title="Active workflows"
          emptyText="Nothing in flight. Workflows appear automatically when agents hand off work."
          workflows={data.activeWorkflows}
          onSelect={setSelected}
        />
        {/* 3. Blocked Workflows */}
        <WorkflowSection
          title="Blocked workflows"
          emptyText="Nothing blocked. Good."
          workflows={data.blockedWorkflows}
          onSelect={setSelected}
        />
      </div>

      {/* 2. Completed Workflows */}
      <WorkflowSection
        title="Completed workflows"
        emptyText="No completed workflows yet."
        workflows={data.completedWorkflows}
        onSelect={setSelected}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 4. Agent Handoffs */}
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Agent handoffs</h3>
            {data.handoffs.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">No handoffs recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.handoffs.slice(0, 12).map((h, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border p-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <AgentChip agent={h.fromAgent} />
                      <span className="text-brand-muted">→</span>
                      <AgentChip agent={h.toAgent} />
                      <span className="ml-1 truncate text-brand-muted">{h.title}</span>
                    </div>
                    <span className="text-xs text-brand-muted">{timeAgo(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Outputs Created */}
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Outputs created</h3>
            {data.outputs.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">No outputs recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.outputs.slice(0, 12).map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-primary">{o.title}</p>
                      <p className="text-xs text-brand-muted">
                        {o.outputType.replace(/_/g, " ")} · {o.agentId} · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <StatusPill value={o.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 6. Founder Decisions */}
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Founder decisions</h3>
            {data.decisions.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">No decisions recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.decisions.slice(0, 12).map((d) => (
                  <div key={d.id} className="rounded-xl border border-brand-border p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize text-brand-primary">
                        {d.decision.replace(/_/g, " ")}
                      </p>
                      <span className="text-xs text-brand-muted">{timeAgo(d.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {d.decisionType.replace(/_/g, " ")} · {d.reason}
                      {d.feedback ? ` — "${d.feedback}"` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. Bottlenecks */}
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Bottlenecks</h3>
            {openBottlenecks.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">No open bottlenecks. The machine is humming.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {openBottlenecks.slice(0, 10).map((b) => (
                  <div key={b.id} className="rounded-xl border border-brand-border p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-brand-primary">{b.description}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[b.severity] ?? SEVERITY_STYLE.medium}`}>
                        {b.severity}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {b.bottleneckType.replace(/_/g, " ")} · {b.agentId}
                      {b.recommendedFix ? ` · Fix: ${b.recommendedFix}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <WorkflowDrawer workflow={selected} data={data} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${alert ? "text-amber-600" : "text-brand-primary"}`}>{value}</p>
      <p className="text-xs text-brand-muted">{label}</p>
    </div>
  );
}

function WorkflowSection({
  title,
  emptyText,
  workflows,
  onSelect,
}: {
  title: string;
  emptyText: string;
  workflows: CompanyWorkflowRow[];
  onSelect: (w: CompanyWorkflowRow) => void;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="font-heading font-semibold text-brand-primary">
          {title} {workflows.length > 0 && <span className="text-sm font-normal text-brand-muted">({workflows.length})</span>}
        </h3>
        {workflows.length === 0 ? (
          <p className="mt-2 text-sm text-brand-muted">{emptyText}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {workflows.map((w) => (
              <WorkflowRow key={w.id} workflow={w} onClick={() => onSelect(w)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
