"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, HardDriveUpload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testStorageUpload } from "@/lib/actions/storage-diagnostics";
import type { StorageSelfTestResult } from "@/lib/storage/media-storage";

const STEP_ICON = {
  pass: { Icon: CheckCircle2, tone: "text-emerald-600", label: "PASS" },
  warning: { Icon: AlertTriangle, tone: "text-amber-600", label: "WARNING" },
  fail: { Icon: XCircle, tone: "text-red-600", label: "FAIL" },
} as const;

/**
 * Phase 38 — live storage round-trip: tiny test file → upload → signed URL
 * → download → delete, with the exact result of each step.
 */
export function StorageTestButton({ bucket }: { bucket: string }) {
  const [result, setResult] = useState<StorageSelfTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await testStorageUpload(bucket);
      if (res.ok) {
        setResult(res.result);
      } else {
        setResult(null);
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <Button size="sm" disabled={pending} onClick={run}>
        <HardDriveUpload className="mr-1 h-3.5 w-3.5" />
        {pending ? "Testing storage…" : "Test Storage Upload"}
      </Button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-brand-border/60 bg-brand-bg/40 p-3">
          <p className="text-xs font-bold text-brand-primary">
            Bucket <code>{result.bucket}</code> —{" "}
            {result.ok ? "all steps passed" : "FAILED — see steps below"}
            {!result.serviceRole && " (running on anon key)"}
          </p>
          {result.steps.map((step) => {
            const meta = STEP_ICON[step.status];
            const Icon = meta.Icon;
            return (
              <div key={step.id} className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
                <p className="min-w-0 text-xs text-brand-primary">
                  <span className={`font-bold ${meta.tone}`}>{meta.label}</span>{" "}
                  <span className="font-semibold">{step.label}:</span>{" "}
                  <span className="break-words text-brand-muted">{step.detail}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
