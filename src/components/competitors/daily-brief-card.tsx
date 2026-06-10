import { Shield, Target, Zap } from "lucide-react";
import type { CompetitorDailyBrief } from "@/lib/types";

export function DailyBriefCard({ brief }: { brief: CompetitorDailyBrief | null }) {
  if (!brief) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border py-10 text-center text-sm text-brand-muted">
        No daily brief yet. Run Sentinel to generate intelligence report.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
      <h3 className="font-heading text-lg font-bold text-brand-primary">Sentinel Daily Brief</h3>
      <p className="mt-1 text-xs text-brand-muted">
        {brief.competitorsScanned} competitors scanned · {brief.alertsCount} alerts · {brief.briefDate}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Biggest Threat</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">{brief.biggestThreat}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Biggest Opportunity</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">{brief.biggestOpportunity}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Recommended Response</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">{brief.recommendedResponse}</p>
        </div>
      </div>
    </div>
  );
}
