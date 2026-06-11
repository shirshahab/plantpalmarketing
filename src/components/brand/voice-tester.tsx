"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceScoreBadge } from "@/components/shared/voice-score-badge";
import { testBrandVoice } from "@/lib/actions/brand-voice";
import type { AIVoiceCheckResult } from "@/lib/brand/voice-check";
import type { BrandPlatform } from "@/lib/brand/brand-brain";

const PLATFORM_OPTIONS: { value: BrandPlatform | ""; label: string }[] = [
  { value: "", label: "Any platform" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
  { value: "tiktok", label: "TikTok" },
  { value: "reddit", label: "Reddit" },
];

export function VoiceTester() {
  const [text, setText] = useState("");
  const [platform, setPlatform] = useState<BrandPlatform | "">("");
  const [result, setResult] = useState<AIVoiceCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await testBrandVoice(text, platform || undefined);
      if (res.ok) {
        setResult(res.result);
      } else {
        setResult(null);
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-brand-primary">Voice tester</h2>
      <p className="mt-0.5 text-xs text-brand-muted">
        Paste any caption. The gate scores it 1–10. Below 8 never reaches the founder.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Try: "Your monstera isn\'t dramatic. You\'re watering it like a maniac."'}
        rows={4}
        className="mt-3 w-full rounded-lg border border-brand-border bg-brand-bg/40 px-3 py-2 text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as BrandPlatform | "")}
          className="rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
        >
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button size="sm" disabled={pending || !text.trim()} onClick={run}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {pending ? "Scoring…" : "Run Voice Check"}
        </Button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 rounded-xl border border-brand-border/60 bg-brand-bg/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <VoiceScoreBadge score={result.score} />
            <span className="text-xs font-semibold text-brand-primary">
              {result.verdict === "pass"
                ? "Cleared for founder approval."
                : result.verdict === "needs_revision"
                  ? "Needs revision before it goes anywhere."
                  : "Failed PlantPal voice — automatic rejection, back to Sage."}
            </span>
            {result.aiUsed && (
              <span className="rounded-full border border-brand-border px-1.5 py-0.5 text-[10px] text-brand-muted">
                AI judge + rules
              </span>
            )}
          </div>

          {result.violations.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-brand-primary">
              {result.violations.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          )}

          {result.answers && (
            <dl className="mt-3 space-y-1 text-xs">
              {Object.entries(result.answers).map(([question, answer]) => (
                <div key={question} className="flex items-start gap-1.5">
                  <span>{answer ? "✅" : "❌"}</span>
                  <span className="text-brand-muted">{question}</span>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
