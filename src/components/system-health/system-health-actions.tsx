"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SystemHealthActions({
  demoCount,
}: {
  demoCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runCleanup(type: "hq" | "demo") {
    setMessage(null);
    startTransition(async () => {
      try {
        const res =
          type === "hq"
            ? await fetch("/api/admin/cleanup-hq-data", { method: "POST" })
            : await fetch("/api/system-health/delete-demo-data", { method: "POST" });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          setMessage(String(data.error ?? "Cleanup failed"));
          return;
        }
        if (type === "hq") {
          setMessage(
            `HQ cleanup: ${data.badVideoRowsRejected} video, ${data.badImageRowsRejected} image rejected; ${data.demoRowsDeleted} demo rows handled.`
          );
        } else {
          setMessage(`Demo cleanup: ${data.deleted ?? 0} deleted, ${data.rejected ?? 0} rejected.`);
        }
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Request failed");
      }
    });
  }

  return (
    <div className="md:col-span-2 rounded-2xl border border-brand-border bg-white p-4">
      <h3 className="font-heading font-semibold text-brand-primary">HQ maintenance</h3>
      <p className="mt-1 text-xs text-brand-muted">
        Demo records found: <strong>{demoCount}</strong>. Run cleanup to reject raw creative rows and remove demo data.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => runCleanup("hq")}
          className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Run HQ Cleanup
        </button>
        <button
          type="button"
          disabled={pending || demoCount === 0}
          onClick={() => runCleanup("demo")}
          className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-primary disabled:opacity-50"
        >
          Delete Demo Data
        </button>
        <Link href="/agents/pipeline" className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-accent">
          Content Router →
        </Link>
      </div>
      {message && <p className="mt-2 text-xs text-brand-primary">{message}</p>}
    </div>
  );
}
