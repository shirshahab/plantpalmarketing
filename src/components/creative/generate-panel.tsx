"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { CONTENT_TYPES, OUTPUT_FORMATS } from "@/lib/creative/framework";
import { generateCreativeContentBatch } from "@/lib/actions/creative-content";

export function GeneratePanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [contentType, setContentType] = useState("all");
  const [format, setFormat] = useState("all");
  const [theme, setTheme] = useState("");
  const [brief, setBrief] = useState("");

  function runBatch(count: number, batchId?: string) {
    return generateCreativeContentBatch({
      count,
      contentType: contentType === "all" ? undefined : contentType,
      format: format === "all" ? undefined : format,
      theme: [theme, brief].filter(Boolean).join(". ") || undefined,
      batchId,
    });
  }

  function handleGenerate(count: number) {
    setError(null);
    setProgress(`Generating ${count} idea${count > 1 ? "s" : ""}…`);
    startTransition(async () => {
      const result = await runBatch(count);
      if (result.ok) {
        setProgress(null);
        router.refresh();
      } else {
        setError(result.error);
        setProgress(null);
      }
    });
  }

  function handleGenerate100() {
    setError(null);
    const batchId = crypto.randomUUID();
    startTransition(async () => {
      let total = 0;
      const batches = 10;
      const perBatch = 10;

      for (let i = 0; i < batches; i++) {
        setProgress(`Generating ideas… ${total}/${batches * perBatch}`);
        const result = await runBatch(perBatch, batchId);
        if (!result.ok) {
          setError(result.error);
          setProgress(null);
          return;
        }
        total += result.count;
      }

      setProgress(`Done — ${total} ideas saved.`);
      router.refresh();
      setTimeout(() => setProgress(null), 4000);
    });
  }

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Creative Content Engine
          </h2>
          <p className="text-sm text-brand-muted">
            Top-creator energy — not generic marketing copy.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Content type</Label>
          <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="all">All types (mixed)</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Output format</Label>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">All formats (mixed)</option>
            {OUTPUT_FORMATS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Theme (optional)</Label>
          <Input
            placeholder="e.g. spring planting, Texas heat, monstera drama"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label>Creative brief (optional)</Label>
          <Textarea
            rows={2}
            placeholder="Any extra direction for the AI…"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={pending} onClick={() => handleGenerate(5)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate 5 Ideas
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => handleGenerate(10)}>
          Generate 10 Ideas
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={handleGenerate100}
          className="border-brand-accent/40 bg-brand-accent/10 text-brand-primary hover:bg-brand-accent/20"
        >
          <Zap className="h-4 w-4" />
          Generate 100 Ideas
        </Button>
      </div>

      {progress && (
        <p className="mt-3 text-sm font-medium text-brand-primary">{progress}</p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-xs text-brand-muted">
        100 ideas = 10 batches of 10. Saved to Supabase with viral & difficulty scores.
        Human approval required before publishing.
      </p>
    </div>
  );
}
