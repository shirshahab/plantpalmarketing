"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SproutScheduledPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-100 text-pink-800",
  TikTok: "bg-slate-900 text-white",
  X: "bg-sky-100 text-sky-800",
  Threads: "bg-gray-100 text-gray-800",
  Pinterest: "bg-red-100 text-red-800",
  YouTube: "bg-red-50 text-red-700",
};

export function PublishingCalendar({ posts }: { posts: SproutScheduledPost[] }) {
  const byDate = useMemo(() => {
    const map = new Map<string, SproutScheduledPost[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const key = p.scheduledAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [posts]);

  if (byDate.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-white/60 px-6 py-12 text-center">
        <Calendar className="mx-auto h-8 w-8 text-brand-muted" />
        <p className="mt-3 text-sm text-brand-muted">No scheduled posts yet. Approve schedules to populate the calendar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byDate.map(([date, dayPosts]) => (
        <Card key={date}>
          <CardContent className="py-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">{formatDate(date)}</h3>
              <Badge variant="muted">{dayPosts.length} posts</Badge>
            </div>
            <div className="space-y-2">
              {dayPosts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-bg/40 px-3 py-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${platformColors[p.platform] ?? "bg-gray-100"}`}>
                    {p.platform}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.hook}</span>
                  <Badge variant={p.status === "published" ? "muted" : "success"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
