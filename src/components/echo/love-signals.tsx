"use client";

import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EchoLoveSignal } from "@/lib/types";

export function LoveSignals({ signals }: { signals: EchoLoveSignal[] }) {
  if (signals.length === 0) {
    return <p className="text-sm text-brand-muted">No love signals detected yet.</p>;
  }

  return (
    <div className="space-y-3">
      {signals.map((s) => (
        <div key={s.id} className="rounded-xl border border-pink-200 bg-pink-50/50 p-4">
          <div className="flex items-start gap-3">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-brand-primary">{s.feature}</p>
                <Badge variant="muted">{s.source}</Badge>
                {s.testimonialReady && <Badge variant="success">Testimonial ready</Badge>}
                {s.ambassadorPotential && <Badge variant="info">Ambassador</Badge>}
              </div>
              <p className="mt-2 text-sm italic text-brand-primary">&ldquo;{s.quote}&rdquo;</p>
              <p className="mt-2 text-[10px] text-brand-sage">Marketing potential: {s.marketingPotential}/100</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
