import { Radar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SourceLinks } from "@/components/shared/source-links";
import { F5BotAlertActions, F5BotFetchButton } from "@/components/intelligence/f5bot-alert-actions";
import { getIntelligencePageData } from "@/lib/intelligence/queries";
import { getF5BotDiagnostics } from "@/lib/intelligence/f5bot-diagnostics";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

async function loadIntelligence() {
  const [page, diagnostics] = await Promise.all([getIntelligencePageData(), getF5BotDiagnostics()]);
  return { page, diagnostics };
}

const PRIORITY_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  urgent: "danger",
  high: "warning",
  medium: "info",
  low: "muted",
};

const OPP_LABELS: Record<string, string> = {
  community_opportunity: "Community",
  competitor_alert: "Competitor",
  reply_draft: "Reply draft",
  content_idea: "Content idea",
  seo_topic: "SEO topic",
};

export default async function IntelligencePage() {
  const { data, configured } = await fetchPageData(loadIntelligence);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Intelligence" description="F5Bot community signals" />
        <ConfigBanner />
      </div>
    );
  }

  const page = data?.page ?? { alerts: [], opportunities: [], routing: [] };
  const diagnostics = data?.diagnostics;

  return (
    <div>
      <PageHeader
        title="Intelligence"
        description="F5Bot feeds Reddit, Hacker News, Lobsters and more into PlantPal — opportunities, replies, content, and competitor alerts."
      />

      {/* Setup */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <h2 className="mb-3 text-sm font-semibold text-brand-primary">Setup</h2>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SetupChip label="API token" ok={diagnostics?.apiTokenPresent} />
            <SetupChip label="JSON feed" ok={diagnostics?.jsonFeedPresent} />
            <SetupChip label="RSS feed" ok={diagnostics?.rssFeedPresent} />
            <SetupChip label="Webhook secret" ok={diagnostics?.webhookSecretPresent} />
          </div>
          {diagnostics && (
            <div className="mb-4 space-y-1 text-xs text-brand-muted">
              <p>
                Webhook URL:{" "}
                <code className="rounded bg-brand-bg px-1 py-0.5">{diagnostics.webhookUrl}</code>
              </p>
              <p>
                HQ production:{" "}
                <code className="rounded bg-brand-bg px-1 py-0.5">
                  https://hq.getplantpal.com/api/intelligence/f5bot/webhook
                </code>
              </p>
              {diagnostics.lastPoll && (
                <p>Last poll {formatDistanceToNow(new Date(diagnostics.lastPoll), { addSuffix: true })}</p>
              )}
              {diagnostics.lastWebhookReceived && (
                <p>
                  Last webhook{" "}
                  {formatDistanceToNow(new Date(diagnostics.lastWebhookReceived), { addSuffix: true })}
                </p>
              )}
              {diagnostics.lastProcessError && (
                <p className="text-rose-700">Last error: {diagnostics.lastProcessError.slice(0, 200)}</p>
              )}
            </div>
          )}
          <F5BotFetchButton />
        </CardContent>
      </Card>

      {/* F5Bot Feed */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-lg font-semibold text-brand-primary">F5Bot Feed</h2>
        {page.alerts.length === 0 ? (
          <EmptyState
            icon={Radar}
            title="No F5Bot alerts yet"
            description="Add env vars, run migration 060, then fetch or configure the webhook."
          />
        ) : (
          <div className="space-y-3">
            {page.alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{alert.source}</Badge>
                    {alert.matchedKeyword && <Badge variant="muted">{alert.matchedKeyword}</Badge>}
                    <Badge variant={alert.status === "processed" ? "success" : "warning"}>{alert.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-brand-primary">{alert.title || "Untitled alert"}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-brand-muted">{alert.body}</p>
                  <SourceLinks
                    sourceUrl={alert.sourceUrl}
                    sourceAuthor={alert.author}
                    sourcePlatform={alert.source}
                    sourceTitle={alert.title}
                    sourceCreatedAt={alert.publishedAt}
                    dataSource="f5bot"
                    compact
                  />
                  <div className="mt-3">
                    <F5BotAlertActions alertId={alert.id} status={alert.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Opportunities */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-lg font-semibold text-brand-primary">Opportunities</h2>
        {page.opportunities.length === 0 ? (
          <p className="text-sm text-brand-muted">Opportunities appear after alerts are processed.</p>
        ) : (
          <div className="space-y-2">
            {page.opportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-brand-border/60 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[opp.priority] ?? "muted"}>{opp.priority}</Badge>
                  <Badge variant="info">{OPP_LABELS[opp.opportunityType] ?? opp.opportunityType}</Badge>
                  <span className="text-xs text-brand-muted">{formatDate(opp.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-brand-primary">{opp.title}</p>
                <p className="text-xs text-brand-muted">{opp.summary.slice(0, 160)}</p>
                {opp.sourceUrl && (
                  <a
                    href={opp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-brand-primary underline"
                  >
                    Open source
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Routing */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-brand-primary">Routing</h2>
        {page.routing.length === 0 ? (
          <p className="text-sm text-brand-muted">Agent routing shows up after opportunities are created.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs text-brand-muted">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2">Next action</th>
                </tr>
              </thead>
              <tbody>
                {page.routing.map((row) => (
                  <tr key={row.opportunityId} className="border-b border-brand-border/40">
                    <td className="py-2 pr-4 font-medium text-brand-primary">{row.title.slice(0, 60)}</td>
                    <td className="py-2 pr-4 capitalize text-brand-muted">{row.assignedAgent}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="info">{row.currentStage}</Badge>
                    </td>
                    <td className="py-2 text-brand-muted">{row.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SetupChip({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-border/60 px-3 py-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-400"}`} />
      <span className="text-brand-primary">{label}</span>
      <span className="ml-auto text-xs text-brand-muted">{ok ? "set" : "missing"}</span>
    </div>
  );
}
