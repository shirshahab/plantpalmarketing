"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Radar, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runDailyContentAgents } from "@/lib/actions/agent-pipeline";

const AGENTS = [
  { name: "Discovery Agent", icon: Radar, desc: "Reddit, trends, seasonal topics, competitors" },
  { name: "Content Agent", icon: PenLine, desc: "31 daily pieces across X, TikTok, Reels, Shorts, carousels, blogs" },
  { name: "Creative Director", icon: Sparkles, desc: "Scores & rewrites until aggregate ≥ 80" },
];

export function RunPipelinePanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runDailyContentAgents();
      if (res.ok) {
        setResult(
          `Pipeline complete — ${res.discoveryCount} discoveries, ${res.contentCount} pieces (${res.approvedCount} passed director, ${res.rejectedCount} rejected). ${res.approvalQueueCount} sent to approval queue.`
        );
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Daily Content Agent Pipeline
          </h2>
          <p className="text-sm text-brand-muted">
            Three agents run in sequence — discovery → content → creative director review.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {AGENTS.map(({ name, icon: Icon, desc }) => (
          <div key={name} className="rounded-xl border border-brand-primary/10 bg-white p-4">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-primary" />
              <span className="text-sm font-semibold text-brand-primary">{name}</span>
            </div>
            <p className="mt-1 text-xs text-brand-muted">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Button disabled={pending} onClick={handleRun}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running agents… (5–15 min)
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              Run Daily Pipeline
            </>
          )}
        </Button>
      </div>

      {pending && (
        <p className="mt-3 text-sm text-brand-muted">
          Discovery → 31 content pieces → Creative Director scoring & rewrites. Do not close this tab.
        </p>
      )}
      {result && <p className="mt-3 text-sm font-medium text-brand-primary">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-xs text-brand-muted">
        Passing content is saved to Supabase and queued in Approval Queue. Human approval required before publishing.
      </p>
    </div>
  );
}
