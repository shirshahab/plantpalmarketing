"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { IvyAlert, IvyRecommendation } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  roi_action: "ROI Action",
  threat: "Threat",
  approval: "Approval",
  growth_opportunity: "Growth",
};

const ALERT_LABELS: Record<string, string> = {
  urgent: "Urgent",
  risk: "Risk",
  growth: "Growth",
};

export function RecommendationFeed({
  recommendations,
  alerts,
}: {
  recommendations: IvyRecommendation[];
  alerts: IvyAlert[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">Recommendation Feed</h2>
          <p className="text-sm text-brand-muted">Scored priorities from all agents</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-brand-muted">Run morning brief to generate recommendations.</p>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-brand-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{CATEGORY_LABELS[rec.category] ?? rec.category}</Badge>
                  <Badge variant={rec.priorityScore >= 85 ? "danger" : "warning"}>Score {rec.priorityScore}</Badge>
                  <span className="text-[10px] text-brand-sage">{rec.sourceAgent}</span>
                </div>
                <p className="mt-2 font-medium text-brand-primary">Ivy recommends: {rec.title}</p>
                <p className="mt-1 text-sm text-brand-muted">{rec.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">Urgent Alerts & Warnings</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-brand-muted">No active alerts today.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 ${
                  alert.alertType === "urgent"
                    ? "border-rose-200 bg-rose-50/50"
                    : alert.alertType === "risk"
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-emerald-200 bg-emerald-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={alert.alertType === "urgent" ? "danger" : alert.alertType === "risk" ? "warning" : "success"}>
                    {ALERT_LABELS[alert.alertType]}
                  </Badge>
                  <span className="text-[10px] text-brand-sage">{alert.sourceAgent}</span>
                </div>
                <p className="mt-2 font-medium text-brand-primary">{alert.title}</p>
                <p className="mt-1 text-sm text-brand-muted">{alert.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
