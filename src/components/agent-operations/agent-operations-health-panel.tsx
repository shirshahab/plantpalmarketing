"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { runF5BotCronFromDashboard } from "@/lib/actions/agent-operations-cron";
import { DailyEngineButton } from "@/components/hq/daily-engine-button";
import type { AgentOperationsHealth, IntelligenceRunSummary } from "@/lib/agent-operations/health";

export function AgentOperationsHealthPanel({ health }: { health: AgentOperationsHealth }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const statusLabel =
    health.status === "ready"
      ? health.environment === "local"
        ? "Local worker system ready. Manual cron test available."
        : "Worker system ready."
      : health.status === "partial"
        ? "Partial configuration. Check env vars below."
        : "Not configured. Set CRON_SECRET, F5BOT_ENABLED, and F5BOT_JSON_FEED_URL.";

  function runF5BotCron() {
    setMessage(null);
    startTransition(async () => {
      const res = await runF5BotCronFromDashboard();
      if (res.ok) {
        setMessage(
          `F5Bot cron complete. Fetched ${res.fetched}, inserted ${res.inserted}, duplicates ${res.duplicates}.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white">
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-semibold text-brand-primary">Intelligence worker health</h3>
              <p className="mt-1 text-sm text-brand-muted">{statusLabel}</p>
            </div>
            <Badge variant={health.status === "ready" ? "success" : health.status === "partial" ? "warning" : "danger"}>
              {health.status}
            </Badge>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <HealthPill label="CRON_SECRET" ok={health.cronSecretSet} />
            <HealthPill label="F5BOT_ENABLED" ok={health.f5botEnabled} />
            <HealthPill label="JSON feed" ok={health.f5botFeedSet} />
            <HealthPill label="Environment" ok={health.environment === "production"} text={health.environment} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={pending || !health.cronSecretSet} onClick={runF5BotCron}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
              Run F5Bot Cron Now
            </Button>
            <DailyEngineButton />
          </div>
          {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">F5Bot ingest run history</h3>
        <Card>
          <CardContent className="divide-y divide-brand-border/20 p-0">
            {health.recentRuns.length === 0 ? (
              <p className="p-6 text-center text-sm text-brand-muted">No intelligence runs yet.</p>
            ) : (
              health.recentRuns.map((run) => <IntelligenceRunRow key={run.id} run={run} />)
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function HealthPill({ label, ok, text }: { label: string; ok: boolean; text?: string }) {
  return (
    <div className="rounded-lg border border-brand-border/60 bg-white px-3 py-2 text-xs">
      <span className="text-brand-muted">{label}: </span>
      <span className="font-semibold text-brand-primary">{text ?? (ok ? "set" : "not set")}</span>
    </div>
  );
}

function IntelligenceRunRow({ run }: { run: IntelligenceRunSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-brand-primary">{formatDate(run.startedAt)}</p>
        <p className="text-xs text-brand-muted">
          fetched {run.fetchedCount} · inserted {run.insertedCount} · dupes {run.duplicateCount} · errors{" "}
          {run.errorCount}
        </p>
      </div>
      <Badge variant={run.status === "success" ? "success" : run.status === "failed" ? "danger" : "warning"}>
        {run.status}
      </Badge>
    </div>
  );
}
