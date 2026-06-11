"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCheck,
  Clipboard,
  CalendarClock,
  History,
  Inbox,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  approveAllLowRisk,
  approveBatchItems,
  rejectBatchItems,
  runDailyAutomation,
  scheduleApprovedContent,
  sendBackToSage,
  setAutomationRuleAction,
  toggleAutomationRule,
  updateBatchItemContent,
} from "@/lib/actions/automation";
import type {
  AgentActivityLog,
  AutomationAction,
  AutomationRiskLevel,
  AutomationRule,
  AutomationRun,
  BatchApprovalItem,
  BatchApprovalItemType,
} from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const TYPE_LABELS: Record<BatchApprovalItemType, string> = {
  x_post: "X posts",
  tiktok_package: "TikTok packages",
  instagram_package: "Instagram packages",
  youtube_package: "YouTube Shorts packages",
  reddit_reply: "Reddit replies",
  blog_draft: "Blog drafts",
  creator_outreach: "Creator outreach drafts",
  other: "Other items",
};

const TYPE_ORDER: BatchApprovalItemType[] = [
  "x_post",
  "tiktok_package",
  "instagram_package",
  "youtube_package",
  "reddit_reply",
  "blog_draft",
  "creator_outreach",
  "other",
];

const RISK_BADGE: Record<AutomationRiskLevel, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const RISK_META: Record<
  AutomationRiskLevel,
  { label: string; description: string; icon: React.ReactNode }
> = {
  low: {
    label: "Low risk — auto-approved",
    description: "Internal reports, ideas, drafts, scheduling, asset prompts. Agents run these without asking.",
    icon: <ShieldCheck className="h-4 w-4 text-brand-accent" />,
  },
  medium: {
    label: "Medium risk — batch approval",
    description: "Captions, titles, and drafts wait in the daily inbox for one-click batch review.",
    icon: <Shield className="h-4 w-4 text-amber-500" />,
  },
  high: {
    label: "High risk — final human approval",
    description: "Public replies, Reddit, outreach, X publishing. Always needs your explicit click.",
    icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
  },
};

const ACTION_LABELS: Record<AutomationAction, string> = {
  auto_approve: "Auto-approve",
  batch_approval: "Batch approval",
  human_approval: "Human approval",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-accent" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function InboxItemCard({
  item,
  selected,
  onToggle,
  onDecide,
  onSendBack,
  onSaveEdit,
  pending,
}: {
  item: BatchApprovalItem;
  selected: boolean;
  onToggle: () => void;
  onDecide: (approved: boolean) => void;
  onSendBack: () => void;
  onSaveEdit: (content: string) => void;
  pending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);

  return (
    <div className={`rounded-xl border p-3 transition-colors ${selected ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-white"}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 accent-[var(--brand-primary)]"
        />
        <div className="min-w-0 flex-1">
          <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={RISK_BADGE[item.riskLevel]}>{item.riskLevel} risk</Badge>
              {item.metadata?.edited === true && <Badge variant="info">edited</Badge>}
              <span className="truncate text-sm font-medium text-brand-primary">{item.title || "Untitled"}</span>
            </div>
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {editing ? (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={pending} onClick={() => { onSaveEdit(draft); setEditing(false); }}>
                      Save edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDraft(item.content); setEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <p className="whitespace-pre-wrap rounded-lg bg-brand-bg p-3 text-xs text-brand-primary">{item.content}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Button variant="success" size="sm" disabled={pending} onClick={() => onDecide(true)}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button variant="danger" size="sm" disabled={pending} onClick={() => onDecide(false)}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
                {!editing && (
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                <Button variant="secondary" size="sm" disabled={pending} onClick={onSendBack}>
                  <RotateCcw className="h-3.5 w-3.5" /> Send back to Sage
                </Button>
                <CopyButton text={item.content} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AutomationPanel({
  rules,
  runs,
  failedRuns,
  pendingItems,
  decidedToday,
  todayActivity,
}: {
  rules: AutomationRule[];
  runs: AutomationRun[];
  failedRuns: AutomationRun[];
  pendingItems: BatchApprovalItem[];
  decidedToday: BatchApprovalItem[];
  todayActivity: AgentActivityLog[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  const rulesConfigured = rules.some((r) => r.id !== "");
  const highRiskPending = pendingItems.filter((i) => i.riskLevel === "high").length;

  const grouped = useMemo(() => {
    const map = new Map<BatchApprovalItemType, BatchApprovalItem[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const item of pendingItems) map.get(item.itemType)?.push(item);
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [pendingItems]);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      setFeedback(result.ok ? result.message ?? "Done" : `Error: ${"error" in result ? result.error : ""}`);
      if (result.ok) setSelectedIds(new Set());
      router.refresh();
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Review Today's Work header */}
      <div className="rounded-2xl border border-brand-accent/30 bg-gradient-to-br from-brand-accent/10 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Review Today&apos;s Work</h2>
              <p className="text-sm text-brand-muted">
                Agents prepared everything — you approve, reject, edit, or send back. No auto-posting.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending} onClick={() => run(runDailyAutomation)}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Daily Automation
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => run(scheduleApprovedContent)}>
              <CalendarClock className="h-4 w-4" />
              Schedule Approved
            </Button>
          </div>
        </div>
        {feedback && (
          <p className={`mt-3 text-sm ${feedback.startsWith("Error") ? "text-red-600" : "text-brand-primary"}`}>
            {feedback}
          </p>
        )}
      </div>

      {/* Inbox stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pending review", value: pendingItems.length },
          { label: "High risk waiting", value: highRiskPending },
          { label: "Decided today", value: decidedToday.length },
          { label: "Failed automations", value: failedRuns.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 py-3">
              <p className="font-heading text-xl font-semibold text-brand-primary">{s.value}</p>
              <p className="text-xs text-brand-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch inbox */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading font-semibold text-brand-primary">Daily Approval Inbox</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              size="sm"
              disabled={pending || pendingItems.every((i) => i.riskLevel === "high")}
              onClick={() => run(approveAllLowRisk)}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Approve all low-risk
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending || selectedIds.size === 0}
              onClick={() => run(() => approveBatchItems(Array.from(selectedIds)))}
            >
              <Check className="h-3.5 w-3.5" /> Approve selected ({selectedIds.size})
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={pending || selectedIds.size === 0}
              onClick={() => run(() => rejectBatchItems(Array.from(selectedIds)))}
            >
              <X className="h-3.5 w-3.5" /> Reject selected
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {grouped.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">
              Inbox is clear. Click &quot;Run Daily Automation&quot; to collect today&apos;s work from the agents.
            </p>
          ) : (
            grouped.map(([type, items]) => (
              <div key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    {TYPE_LABELS[type]}
                  </h4>
                  <Badge variant="muted">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <InboxItemCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onToggle={() => toggleSelect(item.id)}
                      onDecide={(approved) =>
                        run(() => (approved ? approveBatchItems([item.id]) : rejectBatchItems([item.id])))
                      }
                      onSendBack={() => run(() => sendBackToSage(item.id))}
                      onSaveEdit={(content) => run(() => updateBatchItemContent(item.id, content))}
                      pending={pending}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Automation rules */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-brand-primary">Automation Rules</h3>
          {!rulesConfigured && (
            <Badge variant="warning">Defaults shown — editable once setup finishes</Badge>
          )}
        </div>
        <div className="space-y-4">
          {(["low", "medium", "high"] as AutomationRiskLevel[]).map((risk) => {
            const riskRules = rules.filter((r) => r.riskLevel === risk);
            if (riskRules.length === 0) return null;
            return (
              <Card key={risk}>
                <CardHeader className="flex items-center gap-2">
                  {RISK_META[risk].icon}
                  <div>
                    <h4 className="text-sm font-semibold text-brand-primary">{RISK_META[risk].label}</h4>
                    <p className="text-xs text-brand-muted">{RISK_META[risk].description}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {riskRules.map((rule) => (
                    <div
                      key={rule.ruleKey}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border/40 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-primary">{rule.label}</p>
                        <p className="text-xs text-brand-muted">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="muted">{rule.agentId}</Badge>
                        <select
                          value={rule.action}
                          disabled={pending || !rule.id}
                          onChange={(e) => run(() => setAutomationRuleAction(rule.id, e.target.value as AutomationAction))}
                          className="rounded-lg border border-brand-border bg-white px-2 py-1 text-xs text-brand-primary focus:outline-none disabled:opacity-60"
                        >
                          {(Object.keys(ACTION_LABELS) as AutomationAction[]).map((a) => (
                            <option key={a} value={a} disabled={rule.riskLevel === "high" && a === "auto_approve"}>
                              {ACTION_LABELS[a]}
                              {rule.riskLevel === "high" && a === "auto_approve" ? " (locked)" : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={pending || !rule.id}
                          onClick={() => run(() => toggleAutomationRule(rule.id, !rule.enabled))}
                          className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-60 ${rule.enabled ? "bg-brand-accent" : "bg-brand-border"}`}
                          title={rule.enabled ? "Enabled" : "Disabled"}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${rule.enabled ? "left-[18px]" : "left-0.5"}`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Run history + failures + today's agent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-brand-sage" />
            <h3 className="font-heading font-semibold text-brand-primary">Run History</h3>
          </div>
          <Card>
            <CardContent className="space-y-2 p-4">
              {runs.length === 0 ? (
                <p className="text-sm text-brand-muted">No automation runs yet.</p>
              ) : (
                runs.slice(0, 12).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 border-b border-brand-border/20 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-primary">{r.detail || r.action}</p>
                      <p className="text-brand-muted">
                        {r.agentId} · {r.itemsProcessed} processed · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "info"}>
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {failedRuns.length > 0 && (
            <Card className="mt-4 border-red-200">
              <CardHeader className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-700">Failed Automations</h4>
              </CardHeader>
              <CardContent className="space-y-2">
                {failedRuns.map((r) => (
                  <div key={r.id} className="rounded-lg bg-red-50 px-3 py-2 text-xs">
                    <p className="font-medium text-red-800">{r.action}</p>
                    <p className="text-red-700">{r.errorMessage}</p>
                    <p className="text-red-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand-sage" />
            <h3 className="font-heading font-semibold text-brand-primary">What Agents Did Today</h3>
          </div>
          <Card>
            <CardContent className="space-y-2 p-4">
              {todayActivity.length === 0 ? (
                <p className="text-sm text-brand-muted">No agent activity logged today yet.</p>
              ) : (
                todayActivity.slice(0, 15).map((log) => (
                  <div key={log.id} className="border-b border-brand-border/20 py-2 text-xs">
                    <p className="text-brand-primary">{log.detail}</p>
                    <p className="text-brand-muted">
                      <span className="font-semibold capitalize">{log.agentId}</span> ·{" "}
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
