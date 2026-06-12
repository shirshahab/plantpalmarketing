import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase/server";
import { isNextBuildPhase } from "@/lib/build-phase";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkAllApiHealth } from "@/lib/setup/api-health";
import { getF5BotDiagnostics } from "@/lib/intelligence/f5bot-diagnostics";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Every table the app reads or writes, grouped by the page that depends on it. */
const TABLE_GROUPS: Record<string, string[]> = {
  "Core dashboards": ["content_calendar", "approval_queue", "agent_tasks", "agent_messages", "agent_events"],
  "Ivy + reporting": ["ivy_briefs", "ivy_recommendations", "ivy_alerts", "daily_reports", "agent_daily_briefs"],
  "Agent brain": ["agent_profiles", "agent_memory", "agent_conversations", "agent_decisions"],
  "Content pipeline": ["pipeline_content", "discovery_items", "creative_content_ideas", "content_feedback"],
  "Assets + video": ["generated_assets", "generated_videos", "image_prompts", "video_scripts"],
  Automation: ["automation_rules", "automation_runs", "publishing_packages", "batch_approvals", "agent_schedules", "agent_runs"],
  "Company OS": ["company_workflows", "workflow_steps", "company_outputs", "company_decisions", "company_bottlenecks"],
  "SEO factory": ["seo_blog_posts", "seo_blog_keywords", "seo_blog_publish_logs"],
  Reddit: ["reddit_accounts", "reddit_opportunities", "reddit_reply_drafts", "reddit_publish_logs"],
  "Creative department": ["creative_projects", "creative_assets", "creative_reviews"],
  Integrations: [
    "integration_status",
    "integration_logs",
    "provider_health_checks",
    "api_rate_limits",
    "integration_events",
    "api_usage_logs",
  ],
  Intelligence: ["f5bot_alerts", "intelligence_opportunities"],
};

type ProbeClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options: { count: "exact"; head: boolean }
    ) => PromiseLike<{ error: { message: string } | null }>;
  };
};

async function checkTable(table: string): Promise<{ table: string; ok: boolean; detail: string }> {
  try {
    const supabase = createServerClient() as unknown as ProbeClient;
    const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (error) return { table, ok: false, detail: error.message };
    return { table, ok: true, detail: "" };
  } catch (e) {
    return { table, ok: false, detail: e instanceof Error ? e.message : "unknown error" };
  }
}

export default async function SetupHealthPage() {
  await connection();
  noStore();

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Setup Health" description="Admin-only backend setup diagnostics" />
        <ConfigBanner />
      </div>
    );
  }

  if (isNextBuildPhase()) {
    return (
      <div>
        <PageHeader title="Setup Health" description="Admin-only backend setup diagnostics" />
        <p className="text-sm text-brand-muted">Setup checks run at request time after deploy.</p>
      </div>
    );
  }

  const [groups, apiHealth, f5bot] = await Promise.all([
    Promise.all(
      Object.entries(TABLE_GROUPS).map(async ([group, tables]) => ({
        group,
        results: await Promise.all(tables.map(checkTable)),
      }))
    ),
    checkAllApiHealth().catch(() => []),
    getF5BotDiagnostics().catch(() => null),
  ]);

  const missing = groups.flatMap((g) => g.results.filter((r) => !r.ok));

  return (
    <div>
      <PageHeader
        title="Setup Health"
        description="Admin-only diagnostics. Users never see this detail — they get a friendly setup message instead."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          {missing.length === 0 ? (
            <>
              <Badge variant="success">All tables ready</Badge>
              <p className="text-sm text-brand-muted">Every table the app expects is reachable.</p>
            </>
          ) : (
            <>
              <Badge variant="warning">{missing.length} missing</Badge>
              <p className="text-sm text-brand-muted">
                Run <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">supabase/migrations/054_phase33_mobile_pipeline_repair.sql</code>{" "}
                then <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">supabase/migrations/055_phase34_integration_health_repair.sql</code>{" "}
                in the Supabase SQL Editor to repair everything.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {f5bot && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <p className="mb-2 text-sm font-semibold text-brand-primary">F5Bot Intelligence</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <F5BotHealthRow label="API token" ok={f5bot.apiTokenPresent} />
              <F5BotHealthRow label="JSON feed URL" ok={f5bot.jsonFeedPresent} />
              <F5BotHealthRow label="RSS feed URL" ok={f5bot.rssFeedPresent} />
              <F5BotHealthRow label="Webhook secret" ok={f5bot.webhookSecretPresent} />
            </div>
            <p className="mt-3 text-xs text-brand-muted">
              Webhook: <code className="rounded bg-brand-bg px-1">{f5bot.webhookUrl}</code>
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-brand-muted">
              {f5bot.lastPoll && (
                <span>Last poll {formatDistanceToNow(new Date(f5bot.lastPoll), { addSuffix: true })}</span>
              )}
              {f5bot.lastAlertReceived && (
                <span>
                  Last alert {formatDistanceToNow(new Date(f5bot.lastAlertReceived), { addSuffix: true })}
                </span>
              )}
              <span>{f5bot.alertCount} alerts · {f5bot.opportunityCount} opportunities</span>
            </div>
            {f5bot.lastProcessError && (
              <p className="mt-2 text-xs text-rose-700">Last process error: {f5bot.lastProcessError.slice(0, 200)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardContent className="py-4">
          <p className="mb-1 text-sm font-semibold text-brand-primary">API health (live tests)</p>
          <p className="mb-3 text-xs text-brand-muted">
            Each row runs a real lightweight call against the provider with the configured key.
          </p>
          <div className="space-y-2">
            {apiHealth.length === 0 ? (
              <p className="text-sm text-brand-muted">API checks unavailable right now.</p>
            ) : (
              apiHealth.map((api) => (
                <div key={api.id} className="rounded-xl border border-brand-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-primary">{api.label}</span>
                      {api.status === "ok" ? (
                        <Badge variant="success">connected</Badge>
                      ) : api.status === "not_configured" ? (
                        <Badge variant="muted">not configured</Badge>
                      ) : (
                        <Badge variant="danger">error</Badge>
                      )}
                      <span
                        className={`h-2 w-2 rounded-full ${api.envPresent ? "bg-emerald-500" : "bg-rose-400"}`}
                        title={api.envPresent ? "Env present" : "Env missing"}
                      />
                      <code className="text-[10px] text-brand-muted">{api.envVars.join(", ")}</code>
                    </div>
                    {api.lastSuccessAt && (
                      <span className="text-[11px] text-brand-muted">
                        Last success {formatDistanceToNow(new Date(api.lastSuccessAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-brand-muted">{api.message}</p>
                  {api.lastError && (
                    <p className="mt-0.5 text-[11px] text-rose-700">Last error: {api.lastError.slice(0, 200)}</p>
                  )}
                  {api.fix && (
                    <p className="mt-0.5 text-[11px] text-amber-700">Fix: {api.fix}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map(({ group, results }) => (
          <Card key={group}>
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-semibold text-brand-primary">{group}</p>
              <ul className="space-y-1.5">
                {results.map((r) => (
                  <li key={r.table} className="flex items-start justify-between gap-2">
                    <code className="text-xs text-brand-primary">{r.table}</code>
                    {r.ok ? (
                      <Badge variant="success">ok</Badge>
                    ) : (
                      <span className="max-w-[60%] text-right text-[11px] text-amber-600">{r.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function F5BotHealthRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-border/60 px-3 py-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-400"}`} />
      <span>{label}</span>
      <Badge variant={ok ? "success" : "muted"} className="ml-auto">
        {ok ? "present" : "missing"}
      </Badge>
    </div>
  );
}
