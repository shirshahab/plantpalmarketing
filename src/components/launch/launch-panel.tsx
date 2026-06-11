"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { refreshLaunchChecklist } from "@/lib/actions/launch";
import type { LaunchData } from "@/lib/db/launch-queries";

const STATUS_STYLE: Record<string, string> = {
  ready: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  blocked: "bg-red-50 text-red-700",
};

export function LaunchPanel({ data }: { data: LaunchData }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    setMessage("Checking every system...");
    startTransition(async () => {
      const result = await refreshLaunchChecklist();
      setMessage(result.ok ? (result.message ?? "Refreshed") : result.error);
    });
  }

  const scoreColor = data.score >= 80 ? "text-emerald-600" : data.score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-5xl font-bold ${scoreColor}`}>{data.score}</p>
              <p className="mt-1 text-sm text-brand-muted">Launch score (0-100)</p>
              {data.launchReady ? (
                <p className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  All green. Launch ready.
                </p>
              ) : (
                <p className="mt-2 text-sm text-brand-muted">
                  Not launch ready yet. Clear the pending and blocked items below.
                </p>
              )}
            </div>
            <Button onClick={refresh} disabled={pending}>
              {pending ? "Checking..." : "Re-check all systems"}
            </Button>
          </div>
          {message && <p className="mt-3 text-xs text-brand-primary">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Checklist</h3>
          {data.items.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">
              Checklist empty — system setup is still finishing. Re-check shortly.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border p-3">
                  <div>
                    <p className="text-sm font-medium text-brand-primary">{item.label}</p>
                    <p className="text-xs text-brand-muted">
                      {item.category} · weight {item.scoreWeight}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status] ?? STATUS_STYLE.pending}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
