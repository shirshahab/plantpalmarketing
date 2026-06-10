"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FernForecast } from "@/lib/types";

const HORIZON_LABELS: Record<string, string> = {
  "7d": "7-Day",
  "30d": "30-Day",
  "90d": "90-Day",
  monthly: "Monthly",
};

const SOURCE_LABELS: Record<string, string> = {
  all: "All Channels",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  influencers: "Influencers",
  instagram: "Instagram",
};

export function InstallForecast({ forecasts }: { forecasts: FernForecast[] }) {
  if (forecasts.length === 0) {
    return <p className="text-sm text-brand-muted">No install forecasts. Run acquisition scan.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {forecasts.map((f) => (
        <Card key={f.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-primary">
                {HORIZON_LABELS[f.horizon] ?? f.horizon} · {SOURCE_LABELS[f.trafficSource] ?? f.trafficSource}
              </h3>
              <Badge variant="muted">{f.confidence}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-emerald-700">
              +{f.predictedInstalls.toLocaleString()}
            </p>
            <p className="text-xs text-brand-muted">predicted installs</p>
            <p className="mt-2 text-[10px] text-brand-sage line-clamp-2">{f.assumptions}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
