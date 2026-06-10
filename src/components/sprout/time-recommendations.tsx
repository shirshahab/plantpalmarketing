"use client";

import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllPostingRecommendations } from "@/lib/agents/sprout/posting-times";

const platformColors: Record<string, string> = {
  Instagram: "border-pink-200 bg-pink-50/50",
  TikTok: "border-slate-300 bg-slate-50",
  X: "border-sky-200 bg-sky-50/50",
  Threads: "border-gray-200 bg-gray-50",
  Pinterest: "border-red-200 bg-red-50/50",
  YouTube: "border-red-200 bg-red-50/30",
};

export function TimeRecommendations() {
  const slots = getAllPostingRecommendations();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <Card key={slot.platform} className={platformColors[slot.platform]}>
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <Clock className="h-4 w-4 text-brand-sage" />
              </div>
              <div>
                <p className="font-heading font-semibold text-brand-primary">{slot.platform}</p>
                <p className="mt-1 text-sm font-medium text-brand-primary">{slot.label}</p>
                <p className="mt-1 text-xs text-brand-muted">Score {slot.score}/100</p>
                <p className="mt-2 text-xs leading-relaxed text-brand-muted">{slot.rationale}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
