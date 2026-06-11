import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase/server";
import { isNextBuildPhase } from "@/lib/build-phase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  const groups = await Promise.all(
    Object.entries(TABLE_GROUPS).map(async ([group, tables]) => ({
      group,
      results: await Promise.all(tables.map(checkTable)),
    }))
  );

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
                in the Supabase SQL Editor to repair everything in one pass.
              </p>
            </>
          )}
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
