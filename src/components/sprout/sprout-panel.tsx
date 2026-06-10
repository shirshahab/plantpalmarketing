"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, CalendarCheck, Clock, ListOrdered, Loader2, Play, Rocket, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { PublishingCalendar } from "@/components/sprout/publishing-calendar";
import { ContentSchedule } from "@/components/sprout/content-schedule";
import { QueueManagement } from "@/components/sprout/queue-management";
import { TimeRecommendations } from "@/components/sprout/time-recommendations";
import { ReadyQueue } from "@/components/sprout/ready-queue";
import { runSproutQueueScan } from "@/lib/actions/sprout-agent";
import type { SproutScheduledPost } from "@/lib/types";

type Tab = "calendar" | "schedule" | "queue" | "ready" | "times";

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: "calendar", label: "Publishing Calendar", icon: Calendar },
  { id: "schedule", label: "Content Schedule", icon: ListOrdered },
  { id: "queue", label: "Queue Management", icon: CalendarCheck },
  { id: "ready", label: "Ready to Publish", icon: Send },
  { id: "times", label: "Best Times", icon: Clock },
];

export function SproutPanel({
  allPosts,
  calendarPosts,
  queue,
  readyPosts,
  stats,
}: {
  allPosts: SproutScheduledPost[];
  calendarPosts: SproutScheduledPost[];
  queue: SproutScheduledPost[];
  readyPosts: SproutScheduledPost[];
  stats: {
    waiting: number;
    scheduling: number;
    ready: number;
    published: number;
    approvedAwaitingQueue: number;
    total: number;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("calendar");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleScan() {
    setMessage(null);
    startTransition(async () => {
      const res = await runSproutQueueScan();
      if (res.ok) {
        setMessage(`Queued ${res.queued} approved posts (${res.skipped} skipped). Schedule approval required.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-lime-200/60 bg-gradient-to-br from-lime-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-600 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Sprout — Publishing Agent</h2>
              <p className="text-sm text-brand-muted">
                Schedule approved content · Instagram, TikTok, X, Threads, Pinterest, YouTube · No auto-publish
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleScan}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Scan Approved Content
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
        {stats.approvedAwaitingQueue > 0 && (
          <p className="mt-2 text-xs text-brand-muted">
            {stats.approvedAwaitingQueue} human-approved Bloom pieces not yet in Sprout queue
          </p>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Waiting" value={stats.waiting} icon={Clock} />
        <StatCard label="Scheduling" value={stats.scheduling} icon={Calendar} />
        <StatCard label="Ready" value={stats.ready} icon={Send} />
        <StatCard label="Published" value={stats.published} icon={Rocket} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === id ? "bg-lime-600 text-white" : "text-brand-muted hover:bg-brand-bg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "queue" && stats.waiting > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-900">{stats.waiting}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "calendar" && <PublishingCalendar posts={calendarPosts} />}
      {tab === "schedule" && <ContentSchedule posts={allPosts} />}
      {tab === "queue" && <QueueManagement queue={queue} />}
      {tab === "ready" && <ReadyQueue posts={readyPosts} />}
      {tab === "times" && <TimeRecommendations />}
    </div>
  );
}
