"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  FileBarChart,
  Loader2,
  Play,
  TrendingUp,
  Workflow,
  Plug,
  BarChart3,
  Lightbulb,
  ListChecks,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateDailyReport } from "@/lib/actions/daily-report";
import { formatDate } from "@/lib/utils";
import type { DailyReport, GrowthActionItem } from "@/lib/daily-report/types";
import type { CalendarDayStats, ContentCalendarItem } from "@/lib/types";
import type { mapWorkflowRun } from "@/lib/supabase/mappers";

type WorkflowRun = ReturnType<typeof mapWorkflowRun>;

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  completed: "success",
  active: "info",
  blocked: "danger",
  idle: "default",
};

export function DailyReportPanel({
  latestReport,
  reports,
  workflowRuns,
  actionItems,
  calendarStats = null,
  calendarToday = [],
}: {
  latestReport: DailyReport | null;
  reports: DailyReport[];
  workflowRuns: WorkflowRun[];
  actionItems: GrowthActionItem[];
  calendarStats?: (CalendarDayStats & { connected: boolean }) | null;
  calendarToday?: ContentCalendarItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const report = latestReport;

  function handleGenerate() {
    setMessage(null);
    startTransition(async () => {
      const res = await generateDailyReport();
      if (res.ok) {
        setMessage(`Report generated — Ivy logged the run. View saved data below.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-800 text-white">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">PlantPal HQ Daily Report</h2>
              <p className="text-sm text-brand-muted">
                Last 24h executive summary — read-only insights, human approval on all actions
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleGenerate}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Daily Report
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-violet-900">{message}</p>}
      </div>

      {calendarStats?.connected && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">Content Calendar</h3>
            </div>
            <Link href="/calendar" className="text-xs font-medium text-brand-primary underline">
              Open calendar
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-2 sm:grid-cols-5">
                {[
                  { label: "Scheduled today", value: calendarStats.scheduledToday },
                  { label: "Approved", value: calendarStats.approved },
                  { label: "Published today", value: calendarStats.postedToday },
                  { label: "Overdue posts", value: calendarStats.overdue, warn: calendarStats.overdue > 0 },
                  { label: "Missing assets", value: calendarStats.missingAssets, warn: calendarStats.missingAssets > 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-brand-border/30 p-3">
                    <p className="text-[10px] font-semibold uppercase text-brand-sage">{s.label}</p>
                    <p className={`text-lg font-semibold ${s.warn ? "text-amber-700" : "text-brand-primary"}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              {calendarToday.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {calendarToday.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 border-b border-brand-border/20 py-1.5 text-xs">
                      <span className="truncate text-brand-primary">
                        <span className="font-semibold capitalize">{item.platform.replace("_", " ")}</span>
                        {" — "}
                        {item.title || item.hook || item.caption.slice(0, 60)}
                      </span>
                      <Badge
                        variant={
                          item.status === "published"
                            ? "success"
                            : item.status === "ready_to_publish"
                              ? "info"
                              : item.status === "needs_asset"
                                ? "warning"
                                : "default"
                        }
                      >
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-brand-muted">
            No daily report yet. Click Generate to build the first 24h executive summary.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-violet-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-brand-primary">Executive Summary</h3>
                <p className="text-xs text-brand-muted">
                  {formatDate(report.reportDate)} · generated {formatDate(report.createdAt)}
                </p>
              </div>
              <Badge variant="info">{report.analyticsSummary.periodLabel ?? "Last 24 hours"}</Badge>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-primary">{report.summary}</p>
            </CardContent>
          </Card>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">Agent Productivity</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {report.agentProductivity.map((agent) => (
                <Card key={agent.agentId} className="border-brand-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-brand-primary">{agent.name}</p>
                        <p className="text-[10px] text-brand-muted">{agent.role}</p>
                      </div>
                      <Badge variant={agent.productivityScore >= 70 ? "success" : agent.productivityScore >= 50 ? "warning" : "danger"}>
                        {agent.productivityScore}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-brand-muted">
                      <span>Tasks done: {agent.tasksCompleted}</span>
                      <span>Tasks created: {agent.tasksCreated}</span>
                      <span>Messages: {agent.messagesSent}</span>
                      <span>Events: {agent.eventsTriggered}</span>
                      <span>Outputs: {agent.outputsGenerated}</span>
                      <span>Blockers: {agent.blockers.length}</span>
                    </div>
                    {!agent.connected && (
                      <p className="mt-2 text-[10px] text-amber-700">Some agent data not connected yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Workflow className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">Workflow Map</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {report.workflowSummary.all.map((wf) => (
                <Card key={wf.workflowName} className="border-brand-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-primary">{wf.workflowName}</p>
                      <Badge variant={STATUS_VARIANT[wf.status] ?? "default"}>{wf.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">
                      {wf.agentsInvolved.join(" → ")} · {wf.itemsMoved} items moved
                    </p>
                    {wf.bottleneck && (
                      <p className="mt-2 text-xs text-amber-800">Bottleneck: {wf.bottleneck}</p>
                    )}
                    <p className="mt-1 text-xs text-brand-sage">{wf.recommendedFix}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Plug className="h-4 w-4 text-brand-sage" />
                <h3 className="font-heading font-semibold text-brand-primary">API Usage</h3>
              </div>
              <Card>
                <CardContent className="space-y-3 p-4">
                  {!report.apiUsageSummary.connected ? (
                    <p className="text-sm text-brand-muted">integration_logs not connected yet</p>
                  ) : (
                    <>
                      <div className="flex gap-4 text-sm">
                        <span className="text-emerald-700">{report.apiUsageSummary.totalSuccessful} successful</span>
                        <span className="text-rose-700">{report.apiUsageSummary.totalFailed} failed</span>
                        <span className="text-amber-700">{report.apiUsageSummary.totalRateLimitWarnings} rate limits</span>
                      </div>
                      {report.apiUsageSummary.providers.map((p) => (
                        <div key={p.provider} className="rounded-lg border border-brand-border/30 px-3 py-2 text-xs">
                          <span className="font-semibold uppercase">{p.provider}</span>
                          <span className="ml-2 text-brand-muted">
                            {p.totalCalls} calls · {p.successful} ok · {p.failed} err
                          </span>
                          {p.lastSuccessAt && (
                            <p className="text-[10px] text-brand-muted">Last success: {formatDate(p.lastSuccessAt)}</p>
                          )}
                        </div>
                      ))}
                      <p className="text-[10px] text-brand-muted">{report.apiUsageSummary.costEstimatePlaceholder}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-sage" />
                <h3 className="font-heading font-semibold text-brand-primary">Analytics Snapshot</h3>
              </div>
              <Card>
                <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
                  {Object.entries(report.analyticsSummary.sections ?? {}).map(([key, section]) => (
                    <div key={key} className="rounded-lg border border-brand-border/30 p-3">
                      <p className="text-[10px] font-semibold uppercase text-brand-sage">{section.label}</p>
                      <p className="text-lg font-semibold text-brand-primary">
                        {!section.connected ? "not connected yet" : section.value}
                      </p>
                      {section.detail && section.connected && (
                        <p className="text-[10px] text-brand-muted">{section.detail}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </div>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">Growth Upgrade Recommendations</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {report.growthRecommendations.map((rec) => (
                <Card key={rec.title} className="border-sky-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-brand-primary">{rec.title}</p>
                      <Badge variant="info">{rec.effort} effort</Badge>
                    </div>
                    <p className="mt-2 text-xs text-brand-muted">{rec.whyItMatters}</p>
                    <p className="mt-2 text-xs text-brand-primary">
                      <strong>Impact:</strong> {rec.expectedImpact}
                    </p>
                    <p className="mt-1 text-xs text-brand-sage">
                      Owner: {rec.ownerAgent} · Next: {rec.nextStep}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">Recommended Next Actions</h3>
            </div>
            <div className="space-y-2">
              {report.recommendedActions.map((action, i) => (
                <div
                  key={`${action.title}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-brand-border/40 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">{action.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">{action.description}</p>
                    <p className="mt-1 text-[10px] text-violet-700">
                      Owner: {action.ownerAgent}
                      {action.requiresHumanApproval && " · Requires human approval"}
                    </p>
                  </div>
                  <Badge variant={action.priority === "urgent" ? "danger" : action.priority === "high" ? "warning" : "default"}>
                    {action.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(workflowRuns.length > 0 || actionItems.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {workflowRuns.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-brand-primary">Persisted Workflow Runs</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {workflowRuns.slice(0, 6).map((w) => (
                  <div key={w.id} className="flex justify-between border-b border-brand-border/20 py-2">
                    <span>{w.workflowName}</span>
                    <Badge variant={STATUS_VARIANT[w.status] ?? "default"}>{w.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {actionItems.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-brand-primary">Growth Action Items</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {actionItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="border-b border-brand-border/20 py-2">
                    <p className="font-medium text-brand-primary">{item.title}</p>
                    <p className="text-brand-muted">
                      Impact {item.impactScore} · Effort {item.effortScore} · {item.ownerAgent}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {reports.length > 1 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-brand-primary">Report History</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-brand-muted">
            {reports.map((r) => (
              <div key={r.id} className="flex justify-between border-b border-brand-border/20 py-2">
                <span>{formatDate(r.reportDate)}</span>
                <span>{r.agentProductivity.length} agents · {r.growthRecommendations.length} recs</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
