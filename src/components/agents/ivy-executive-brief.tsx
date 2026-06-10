"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Crown,
  FileText,
  Inbox,
  ListChecks,
  Loader2,
  Megaphone,
  Play,
  Plug,
  Rocket,
  ShieldAlert,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateDailyReport } from "@/lib/actions/daily-report";
import { formatDate } from "@/lib/utils";
import type { ActionItemEntry, DailyReport } from "@/lib/daily-report/types";
import type { CalendarDayStats, ContentCalendarItem } from "@/lib/types";

export interface BriefProviderStatus {
  provider: string;
  label: string;
  status: string;
  configured: boolean;
  lastErrorMessage: string;
}

export interface BriefCompetitorAlert {
  id: string;
  competitor: string;
  title: string;
  severity: string;
  recommendedAction: string;
  createdAt: string;
}

const WORKFLOW_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  completed: "success",
  active: "info",
  blocked: "danger",
  idle: "default",
};

function gradeFor(score: number): { grade: string; variant: "success" | "warning" | "danger" } {
  if (score >= 85) return { grade: "A", variant: "success" };
  if (score >= 70) return { grade: "B", variant: "success" };
  if (score >= 55) return { grade: "C", variant: "warning" };
  if (score >= 40) return { grade: "D", variant: "warning" };
  return { grade: "F", variant: "danger" };
}

function SectionHeading({
  icon: Icon,
  number,
  title,
}: {
  icon: typeof Users;
  number: number;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-800">
        {number}
      </span>
      <Icon className="h-4 w-4 text-brand-sage" />
      <h3 className="font-heading font-semibold text-brand-primary">{title}</h3>
    </div>
  );
}

export function IvyExecutiveBrief({
  report,
  providerStatuses,
  competitorAlerts,
  calendarStats,
  calendarToday,
}: {
  report: DailyReport | null;
  providerStatuses: BriefProviderStatus[];
  competitorAlerts: BriefCompetitorAlert[];
  calendarStats: (CalendarDayStats & { connected: boolean }) | null;
  calendarToday: ContentCalendarItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleGenerate() {
    setMessage(null);
    startTransition(async () => {
      const res = await generateDailyReport();
      if (res.ok) {
        setMessage("Brief generated. Ivy logged the run.");
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Ivy header */}
      <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-800 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Ivy Executive Brief</h2>
              <p className="text-sm text-brand-muted">
                Chief of Staff report — last 24 hours across all 12 agents. Five minutes covers everything.
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleGenerate}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Today&apos;s Brief
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-violet-900">{message}</p>}
      </div>

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-brand-muted">
            No brief yet. Click Generate Today&apos;s Brief — Ivy will compile the full company report.
          </CardContent>
        </Card>
      ) : (
        <>
          {report.executiveSummary?.aiError && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{report.executiveSummary.aiError}</p>
                <p className="mt-0.5 text-xs">
                  Ivy used the rule-based summary instead. The failed attempt is in the integration logs.
                </p>
              </div>
            </div>
          )}

          {/* 1. Executive Summary */}
          <section>
            <SectionHeading icon={FileText} number={1} title="Executive Summary" />
            <Card className="border-violet-200/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <p className="text-xs text-brand-muted">
                  {formatDate(report.reportDate)} · compiled by Ivy, Chief of Staff
                </p>
                <Badge variant="info">Last 24 hours</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-primary">{report.summary}</p>
                {report.executiveSummary && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-brand-border/40 bg-brand-bg/30 p-3">
                      <p className="text-[10px] font-semibold uppercase text-brand-sage">What happened</p>
                      <p className="mt-1 text-xs text-brand-primary">{report.executiveSummary.whatHappened}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-emerald-700">Biggest win</p>
                      <p className="mt-1 text-xs text-brand-primary">{report.executiveSummary.biggestWin}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-rose-700">Biggest risk</p>
                      <p className="mt-1 text-xs text-brand-primary">{report.executiveSummary.biggestRisk}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-amber-700">Needs your attention</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-brand-primary">
                        {report.executiveSummary.needsAttention.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 2. Agent Report Card */}
          <section>
            <SectionHeading icon={Users} number={2} title="Agent Report Card" />
            <Card>
              <CardContent className="overflow-x-auto p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-xs text-brand-muted">
                      <th className="pb-2 pr-3">Agent</th>
                      <th className="pb-2 pr-3">Role</th>
                      <th className="pb-2 pr-3 text-center">Grade</th>
                      <th className="pb-2 pr-3 text-center">Tasks</th>
                      <th className="pb-2 pr-3 text-center">Outputs</th>
                      <th className="pb-2 pr-3 text-center">Messages</th>
                      <th className="pb-2 pr-3 text-center">Events</th>
                      <th className="pb-2">Blockers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.agentProductivity]
                      .sort((a, b) => b.productivityScore - a.productivityScore)
                      .map((agent) => {
                        const { grade, variant } = gradeFor(agent.productivityScore);
                        return (
                          <tr key={agent.agentId} className="border-b border-brand-border/40">
                            <td className="py-2 pr-3 font-semibold text-brand-primary">{agent.name}</td>
                            <td className="py-2 pr-3 text-xs text-brand-muted">{agent.role}</td>
                            <td className="py-2 pr-3 text-center">
                              <Badge variant={variant}>
                                {grade} · {agent.productivityScore}
                              </Badge>
                            </td>
                            <td className="py-2 pr-3 text-center text-xs">{agent.tasksCompleted}</td>
                            <td className="py-2 pr-3 text-center text-xs">{agent.outputsGenerated}</td>
                            <td className="py-2 pr-3 text-center text-xs">{agent.messagesSent}</td>
                            <td className="py-2 pr-3 text-center text-xs">{agent.eventsTriggered}</td>
                            <td className="py-2 text-xs text-rose-700">
                              {agent.blockers.length > 0 ? agent.blockers.slice(0, 2).join("; ") : "—"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* 3. Workflow Health */}
          <section>
            <SectionHeading icon={Workflow} number={3} title="Workflow Health" />
            <div className="grid gap-3 lg:grid-cols-2">
              {report.workflowSummary.all.map((wf) => (
                <Card key={wf.workflowName} className="border-brand-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-primary">{wf.workflowName}</p>
                      <Badge variant={WORKFLOW_STATUS_VARIANT[wf.status] ?? "default"}>{wf.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">{wf.itemsMoved} items moved</p>
                    {wf.bottleneck && <p className="mt-2 text-xs text-amber-800">Bottleneck: {wf.bottleneck}</p>}
                    <p className="mt-1 text-xs text-brand-sage">{wf.recommendedFix}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 4. Marketing Performance */}
          <section>
            <SectionHeading icon={Megaphone} number={4} title="Marketing Performance" />
            <Card>
              <CardContent className="p-4">
                {!report.contentReport?.connected && !calendarStats?.connected ? (
                  <p className="text-sm text-brand-muted">Not connected yet</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {[
                        { label: "Content created", value: report.contentReport?.created ?? 0 },
                        { label: "Approved", value: report.contentReport?.approved ?? 0 },
                        { label: "Rejected", value: report.contentReport?.rejected ?? 0 },
                        { label: "Scheduled", value: report.contentReport?.scheduled ?? 0 },
                        { label: "Ready to publish", value: report.contentReport?.readyToPublish ?? 0 },
                        {
                          label: "Missing assets",
                          value: report.contentReport?.missingAssets ?? 0,
                          warn: (report.contentReport?.missingAssets ?? 0) > 0,
                        },
                        {
                          label: "Published today",
                          value: calendarStats?.postedToday ?? 0,
                        },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-brand-border/30 p-2.5">
                          <p className="text-[10px] font-semibold uppercase text-brand-sage">{s.label}</p>
                          <p className={`text-base font-semibold ${s.warn ? "text-amber-700" : "text-brand-primary"}`}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {calendarToday.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-brand-sage">
                            <CalendarDays className="h-3 w-3" /> On the calendar today
                          </p>
                          <Link href="/calendar" className="text-xs font-medium text-brand-primary underline">
                            Open calendar
                          </Link>
                        </div>
                        <div className="mt-1 space-y-1">
                          {calendarToday.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 border-b border-brand-border/20 py-1 text-xs"
                            >
                              <span className="truncate text-brand-primary">
                                <span className="font-semibold capitalize">{(item.platform ?? "").replace("_", " ")}</span>
                                {" — "}
                                {item.title || item.hook || (item.caption ?? "").slice(0, 60)}
                              </span>
                              <Badge variant={item.status === "published" ? "success" : "default"}>
                                {(item.status ?? "").replace(/_/g, " ")}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(report.contentReport?.topOpportunities.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase text-brand-sage">Top content opportunities</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-brand-primary">
                          {report.contentReport!.topOpportunities.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 5 + 6. Growth Opportunities / Competitor Intelligence */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <SectionHeading icon={Rocket} number={5} title="Growth Opportunities" />
              <Card>
                <CardContent className="p-4">
                  {!report.growthReport?.connected ? (
                    <p className="text-sm text-brand-muted">Not connected yet</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Creator leads", value: report.growthReport.creatorLeads },
                          { label: "High priority", value: report.growthReport.highPriorityLeads },
                          { label: "Partnerships", value: report.growthReport.partnershipOpportunities },
                          { label: "Community opps", value: report.growthReport.communityOpportunities },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg border border-brand-border/30 p-2.5">
                            <p className="text-[10px] font-semibold uppercase text-brand-sage">{s.label}</p>
                            <p className="text-base font-semibold text-brand-primary">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      {report.growthReport.recommendedMoves.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold uppercase text-brand-sage">Recommended moves</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-brand-primary">
                            {report.growthReport.recommendedMoves.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeading icon={ShieldAlert} number={6} title="Competitor Intelligence" />
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-brand-border/30 p-2.5">
                      <p className="text-[10px] font-semibold uppercase text-brand-sage">Alerts (24h)</p>
                      <p className="text-base font-semibold text-brand-primary">
                        {report.growthReport?.competitorAlerts ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border border-brand-border/30 p-2.5">
                      <p className="text-[10px] font-semibold uppercase text-brand-sage">High severity</p>
                      <p
                        className={`text-base font-semibold ${
                          (report.growthReport?.highSeverityAlerts ?? 0) > 0 ? "text-rose-700" : "text-brand-primary"
                        }`}
                      >
                        {report.growthReport?.highSeverityAlerts ?? 0}
                      </p>
                    </div>
                  </div>
                  {competitorAlerts.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      {competitorAlerts.slice(0, 4).map((a) => (
                        <div key={a.id} className="border-b border-brand-border/20 py-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-brand-primary">
                              {a.competitor}: {a.title}
                            </p>
                            <Badge variant={a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "default"}>
                              {a.severity}
                            </Badge>
                          </div>
                          {a.recommendedAction && <p className="mt-0.5 text-brand-muted">{a.recommendedAction}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-brand-muted">No active competitor alerts. Sentinel is watching.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* 7 + 8. System Health / API Usage */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <SectionHeading icon={Activity} number={7} title="System Health" />
              <Card>
                <CardContent className="space-y-2 p-4">
                  {providerStatuses.length === 0 ? (
                    <p className="text-sm text-brand-muted">Not connected yet</p>
                  ) : (
                    providerStatuses.map((p) => (
                      <div
                        key={p.provider}
                        className="flex items-center justify-between gap-2 rounded-lg border border-brand-border/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              !p.configured
                                ? "bg-slate-300"
                                : p.status === "connected"
                                  ? "bg-emerald-500"
                                  : p.status === "degraded"
                                    ? "bg-amber-400"
                                    : "bg-rose-500"
                            }`}
                          />
                          <span className="font-semibold text-brand-primary">{p.label}</span>
                        </div>
                        <span className="max-w-[60%] truncate text-right text-brand-muted">
                          {!p.configured ? "Not configured" : p.status === "connected" ? "Connected" : p.lastErrorMessage || p.status}
                        </span>
                      </div>
                    ))
                  )}
                  <Link href="/integrations" className="block pt-1 text-xs font-medium text-brand-primary underline">
                    Open integrations
                  </Link>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeading icon={Plug} number={8} title="API Usage" />
              <Card>
                <CardContent className="space-y-2 p-4">
                  {!report.apiUsageSummary.connected ? (
                    <p className="text-sm text-brand-muted">Not connected yet</p>
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
                          {p.lastErrorMessage && <p className="text-[10px] text-rose-700">Last error: {p.lastErrorMessage}</p>}
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* 9. Founder Inbox */}
          {report.founderReview && (
            <section>
              <SectionHeading icon={Inbox} number={9} title="Founder Inbox" />
              <Card className="border-violet-200/40">
                <CardContent className="p-4">
                  <div className="grid gap-2 sm:grid-cols-4">
                    {[
                      { label: "Needing approval", value: report.founderReview.needingApproval },
                      { label: "Ready to publish", value: report.founderReview.readyToPublish },
                      { label: "Outreach awaiting OK", value: report.founderReview.outreachAwaiting },
                      { label: "High-risk items", value: report.founderReview.highRisk, warn: report.founderReview.highRisk > 0 },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-brand-border/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-brand-sage">{s.label}</p>
                        <p className={`text-lg font-semibold ${s.warn ? "text-rose-700" : "text-brand-primary"}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {report.founderReview.items.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      {report.founderReview.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 border-b border-brand-border/20 py-1.5 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-brand-primary">{item.label}</p>
                            <p className="text-brand-muted">{item.detail}</p>
                          </div>
                          <Badge variant={item.kind === "high_risk" ? "danger" : item.kind === "publish" ? "info" : "warning"}>
                            {item.kind.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-brand-muted">Inbox zero. Nothing waiting on you.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* 10. Recommended Actions */}
          {report.actionPlan && (
            <section>
              <SectionHeading icon={ListChecks} number={10} title="Recommended Actions" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(
                  [
                    { title: "Urgent", items: report.actionPlan.urgent, accent: "border-rose-200/60" },
                    { title: "Growth", items: report.actionPlan.growth, accent: "border-sky-200/60" },
                    { title: "Content", items: report.actionPlan.content, accent: "border-emerald-200/60" },
                    { title: "System", items: report.actionPlan.system, accent: "border-amber-200/60" },
                  ] as { title: string; items: ActionItemEntry[]; accent: string }[]
                ).map((group) => (
                  <Card key={group.title} className={group.accent}>
                    <CardHeader className="pb-2">
                      <h4 className="text-sm font-semibold text-brand-primary">{group.title}</h4>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pt-0">
                      {group.items.map((a, i) => (
                        <div key={i} className="rounded-lg border border-brand-border/30 p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-brand-primary">{a.title}</p>
                            <Badge variant={a.priority === "urgent" ? "danger" : a.priority === "high" ? "warning" : "default"}>
                              {a.priority}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-brand-muted">{a.nextStep}</p>
                          <p className="mt-1 text-[10px] text-violet-700 capitalize">
                            Owner: {a.ownerAgent} · Impact {a.impactScore}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* 11. Social Analytics */}
          <section>
            <SectionHeading icon={BarChart3} number={11} title="Social Analytics" />
            <Card>
              <CardContent className="p-4">
                {!report.analyticsSummary.xSocial?.connected ? (
                  <p className="text-sm text-brand-muted">
                    Not connected yet — add X_BEARER_TOKEN in Vercel to light this up.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      { label: "X followers", value: report.analyticsSummary.xSocial.followerCount },
                      { label: "Engagement (24h)", value: report.analyticsSummary.xSocial.engagement24h },
                      { label: "Drafts", value: report.analyticsSummary.xSocial.drafts },
                      { label: "Gate queue", value: report.analyticsSummary.xSocial.gateQueue },
                      { label: "Publish queue", value: report.analyticsSummary.xSocial.publishQueue },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-brand-border/30 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-brand-sage">{s.label}</p>
                        <p className="text-base font-semibold text-brand-primary">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["xPosts", "xQueue", "contentCalendar", "hqWorkflowEvents"] as const).map((key) => {
                    const section = report.analyticsSummary.sections?.[key];
                    if (!section) return null;
                    return (
                      <div key={key} className="rounded-lg border border-brand-border/30 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-brand-sage">{section.label}</p>
                        <p className="text-base font-semibold text-brand-primary">
                          {!section.connected ? "Not connected yet" : section.value}
                        </p>
                        {section.detail && section.connected && (
                          <p className="text-[10px] text-brand-muted">{section.detail}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Sign-off */}
          <div className="flex items-center gap-2 rounded-2xl border border-brand-border/40 bg-brand-bg/30 px-4 py-3 text-xs text-brand-muted">
            <ClipboardCheck className="h-4 w-4 text-violet-700" />
            <span>
              Compiled by <span className="font-semibold text-brand-primary">Ivy — Chief of Staff</span>. No agent posts
              publicly or contacts anyone without your approval.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
