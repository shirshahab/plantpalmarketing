"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runDailyEngineFromDashboard } from "@/lib/actions/daily-engine-actions";

export function DailyEngineButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage("Daily engine running. This can take a few minutes...");
    startTransition(async () => {
      const res = await runDailyEngineFromDashboard();
      if (res.ok) {
        const r = res.result;
        setMessage(
          `Done. F5Bot +${r.f5bot.inserted}/${r.f5bot.rejected} rejected. Blog ${r.blogDraftsCreated}, social ${r.socialDraftsCreated}, memes ${r.memeIdeasCreated}, videos ${r.videoIdeasCreated}, images ${r.imageIdeasCreated}.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className={className}>
      <Button size="sm" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        Run Daily Engine Now
      </Button>
      {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
    </div>
  );
}
