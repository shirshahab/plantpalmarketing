"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BloomContentPiece } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const formatColors: Record<string, string> = {
  x_post: "bg-sky-100 text-sky-800",
  threads_post: "bg-slate-100 text-slate-800",
  tiktok_concept: "bg-pink-100 text-pink-800",
  reels_concept: "bg-purple-100 text-purple-800",
  shorts_concept: "bg-red-100 text-red-800",
  carousel: "bg-violet-100 text-violet-800",
  blog_idea: "bg-amber-100 text-amber-800",
  email_idea: "bg-emerald-100 text-emerald-800",
};

export function ContentCalendar({ pieces }: { pieces: BloomContentPiece[] }) {
  const byDate = useMemo(() => {
    const map = new Map<string, BloomContentPiece[]>();
    for (const p of pieces) {
      if (!p.scheduledDate) continue;
      const key = p.scheduledDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [pieces]);

  if (byDate.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-white/60 px-6 py-12 text-center">
        <Calendar className="mx-auto h-8 w-8 text-brand-muted" />
        <p className="mt-3 text-sm text-brand-muted">No scheduled content yet. Run Bloom to populate the calendar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byDate.map(([date, dayPieces]) => (
        <Card key={date}>
          <CardContent className="py-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-sage" />
              <h3 className="font-heading font-semibold text-brand-primary">{formatDate(date)}</h3>
              <Badge variant="muted">{dayPieces.length} pieces</Badge>
            </div>
            <div className="space-y-2">
              {dayPieces.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-bg/40 px-3 py-2"
                >
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${formatColors[p.format] ?? "bg-gray-100"}`}>
                    {p.platform}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.hook}</span>
                  <span className="text-xs text-brand-muted">Viral {p.viralScore}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
