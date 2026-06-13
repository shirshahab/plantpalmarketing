import Link from "next/link";
import { CalendarDays, ImageIcon, Inbox, Lightbulb, MessageSquare, Radar, Video } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfigBanner } from "@/components/ui/config-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkflowStageBadge } from "@/components/workflow/workflow-stage-badge";
import { LiveIntelligenceSection } from "@/components/inbox/live-intelligence-section";
import { getFounderInbox } from "@/lib/workflow/inbox-queries";
import { getLiveIntelligenceAlerts } from "@/lib/intelligence/saved-alerts-queries";
import { formatDate } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { InboxItem, InboxSection } from "@/lib/workflow/types";
import type { LucideIcon } from "lucide-react";

const SECTION_META: Record<
  Exclude<InboxSection, "intelligence">,
  { title: string; description: string; icon: LucideIcon; empty: string }
> = {
  ideas: {
    title: "Ideas awaiting approval",
    description: "Content ideas and drafts that need a founder yes/no before production.",
    icon: Lightbulb,
    empty: "No ideas waiting on you.",
  },
  images: {
    title: "Images awaiting approval",
    description: "Generated images ready for review — approve to send straight to Calendar.",
    icon: ImageIcon,
    empty: "No images waiting on you.",
  },
  videos: {
    title: "Videos awaiting approval",
    description: "Video packages ready for review — approve to send straight to Calendar.",
    icon: Video,
    empty: "No videos waiting on you.",
  },
  replies: {
    title: "Community replies awaiting approval",
    description: "Reddit and community reply drafts before anything goes live.",
    icon: MessageSquare,
    empty: "No replies waiting on you.",
  },
  calendar: {
    title: "Calendar items awaiting scheduling",
    description: "Approved content that still needs a publish slot on the calendar.",
    icon: CalendarDays,
    empty: "Nothing waiting to be scheduled.",
  },
};

function InboxSectionBlock({
  section,
  items,
}: {
  section: Exclude<InboxSection, "intelligence">;
  items: InboxItem[];
}) {
  const meta = SECTION_META[section];
  const Icon = meta.icon;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">{meta.title}</h2>
          <p className="mt-0.5 text-sm text-brand-muted">{meta.description}</p>
        </div>
        <Badge variant={items.length > 0 ? "warning" : "muted"} className="ml-auto shrink-0">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-brand-muted">{meta.empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={`${item.section}-${item.id}`} href={item.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkflowStageBadge stage={item.stage} />
                      {item.channel ? <Badge variant="muted">{item.channel}</Badge> : null}
                      <span className="text-xs text-brand-muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 font-medium text-brand-primary">{item.title}</p>
                    {item.summary ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-brand-muted">{item.summary}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-brand-accent">Review →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function FounderInboxPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Founder Inbox" />
        <ConfigBanner />
      </div>
    );
  }

  const [inbox, liveIntelligence] = await Promise.all([getFounderInbox(), getLiveIntelligenceAlerts()]);
  const totalPending = inbox.totalPending;

  return (
    <div>
      <PageHeader
        title="Founder Inbox"
        description="Everything that needs your decision — ideas, assets, replies, and live intelligence."
      />

      <div className="mb-8 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-brand-primary">
        <strong>{totalPending} items</strong> need founder action.
      </div>

      {totalPending === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox clear"
          description="Nothing waiting on you right now."
        />
      ) : (
        <>
          <section className="mb-10">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
                <Radar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-brand-primary">Live Intelligence</h2>
                <p className="mt-0.5 text-sm text-brand-muted">
                  High-priority F5Bot signals only — newest first.
                </p>
              </div>
              <Badge variant={liveIntelligence.length > 0 ? "warning" : "muted"} className="ml-auto shrink-0">
                {liveIntelligence.length}
              </Badge>
            </div>
            <LiveIntelligenceSection alerts={liveIntelligence} />
          </section>
          <InboxSectionBlock section="ideas" items={inbox.ideas} />
          <InboxSectionBlock section="images" items={inbox.images} />
          <InboxSectionBlock section="videos" items={inbox.videos} />
          <InboxSectionBlock section="replies" items={inbox.replies} />
          <InboxSectionBlock section="calendar" items={inbox.calendar} />
        </>
      )}
    </div>
  );
}
