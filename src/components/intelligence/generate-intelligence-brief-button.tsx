"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateDailyIntelligenceBriefAction } from "@/lib/actions/intelligence-alerts";

export function GenerateIntelligenceBriefButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await generateDailyIntelligenceBriefAction();
            setMessage(result.ok ? "Daily Intelligence Brief saved" : (result.error ?? "Failed"));
          });
        }}
      >
        {pending ? "Generating…" : "Generate Ivy Brief"}
      </Button>
      {message && <span className="text-xs text-brand-muted">{message}</span>}
    </div>
  );
}
