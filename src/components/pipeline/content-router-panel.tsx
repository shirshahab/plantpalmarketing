"use client";

import Link from "next/link";
import { Inbox, Sparkles, Workflow } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyEngineButton } from "@/components/hq/daily-engine-button";
import { formatDate } from "@/lib/utils";
import type { ContentRouterData, ContentRouterItem } from "@/lib/pipeline/content-router-queries";

function Section({
  title,
  description,
  items,
  emptyHint,
}: {
  title: string;
  description: string;
  items: ContentRouterItem[];
  emptyHint?: string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">{title}</h2>
          <p className="text-xs text-brand-muted">{description}</p>
        </div>
        <Badge variant={items.length > 0 ? "warning" : "muted"}>{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-brand-muted">{emptyHint ?? "Nothing here yet."}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-brand-primary">{item.title}</p>
                  <p className="text-xs text-brand-muted">
                    {item.destination} · {item.status} · {formatDate(item.updatedAt)}
                  </p>
                </div>
                <Link
                  href={
                    item.kind === "video"
                      ? `/video/item/${item.id}`
                      : item.kind === "image"
                        ? `/images?tab=pending`
                        : item.kind === "seo"
                          ? "/blog-pipeline"
                          : "/bloom"
                  }
                  className="text-xs font-medium text-brand-accent hover:underline"
                >
                  Open →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function ContentRouterPanel({ data }: { data: ContentRouterData }) {
  const isEmpty = data.totalWaiting === 0 && data.recentlyRouted.length === 0;

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-brand-primary/15 bg-brand-primary/5 px-4 py-4">
        <p className="text-sm text-brand-primary">
          <strong>Flow:</strong> Intelligence → Founder Inbox → Bloom → Content Router → Video / Image / SEO / Calendar
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Raw internet signals stay in Intelligence. Only Bloom-approved concepts route to creative studios.
        </p>
      </div>

      {isEmpty && (
        <Card className="mb-8 border-dashed">
          <CardContent className="py-10 text-center">
            <Workflow className="mx-auto h-10 w-10 text-brand-muted" />
            <p className="mt-3 font-medium text-brand-primary">No approved content waiting</p>
            <p className="mt-1 text-sm text-brand-muted">
              Approve opportunities from Founder Inbox or Bloom to populate this area.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/inbox">
                <Button size="sm" variant="secondary">
                  <Inbox className="mr-1.5 h-4 w-4" />
                  Open Founder Inbox
                </Button>
              </Link>
              <Link href="/bloom">
                <Button size="sm" variant="secondary">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Open Bloom
                </Button>
              </Link>
              <DailyEngineButton />
            </div>
          </CardContent>
        </Card>
      )}

      <Section
        title="Incoming from Bloom"
        description="Approved concepts Bloom is preparing for routing."
        items={data.incomingFromBloom}
        emptyHint="Bloom has no incoming packages. Send items from Founder Inbox first."
      />
      <Section
        title="Ready for Video"
        description="Clean video concepts awaiting script generation."
        items={data.readyForVideo}
      />
      <Section
        title="Ready for Image"
        description="Clean image concepts awaiting generation."
        items={data.readyForImage}
      />
      <Section
        title="Ready for SEO"
        description="Blog drafts in the SEO pipeline."
        items={data.readyForSeo}
      />
      <Section
        title="Recently Routed"
        description="Latest movement through content_pipeline."
        items={data.recentlyRouted}
      />

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-brand-primary">Workflow History</h2>
        {data.workflowHistory.length === 0 ? (
          <p className="text-sm text-brand-muted">No workflow transitions logged yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-brand-muted">
            {data.workflowHistory.map((h, i) => (
              <li key={`${h.at}-${i}`} className="rounded-lg border border-brand-border px-3 py-2">
                <span className="text-xs text-brand-muted">{formatDate(h.at)}</span>
                <span className="mx-2 text-brand-primary">·</span>
                <span className="font-medium text-brand-primary">{h.title}</span>
                <span className="mx-2">—</span>
                {h.event}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
