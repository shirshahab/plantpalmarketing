"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download, FlaskConical, Layers, Lightbulb, Loader2, Play, Sprout, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { AcquisitionChannels } from "@/components/fern/acquisition-channels";
import { OpportunityList } from "@/components/fern/opportunity-list";
import { ExperimentTracker } from "@/components/fern/experiment-tracker";
import { InstallForecast } from "@/components/fern/install-forecast";
import { runFernAcquisitionScan } from "@/lib/actions/fern-agent";
import type { FernExperiment, FernForecast, FernOpportunity } from "@/lib/types";

type Tab = "opportunities" | "channels" | "experiments" | "forecast";

const TABS: { id: Tab; label: string; icon: typeof Lightbulb }[] = [
  { id: "opportunities", label: "Growth Opportunities", icon: Lightbulb },
  { id: "channels", label: "Acquisition Channels", icon: Layers },
  { id: "experiments", label: "Experiment Tracker", icon: FlaskConical },
  { id: "forecast", label: "Install Forecast", icon: TrendingUp },
];

export function FernPanel({
  opportunities,
  experiments,
  forecasts,
  stats,
}: {
  opportunities: FernOpportunity[];
  experiments: FernExperiment[];
  forecasts: FernForecast[];
  stats: {
    totalOpportunities: number;
    totalEstimatedInstalls: number;
    topPriorityScore: number;
    activeExperiments: number;
    forecast30d: number;
    topChannel: string;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("opportunities");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleScan() {
    setMessage(null);
    startTransition(async () => {
      const res = await runFernAcquisitionScan();
      if (res.ok) {
        setMessage(
          `Scan complete — ${res.opportunitiesCount} opportunities, ${res.experimentsCount} experiments, ${res.forecastsCount} forecasts. Fern recommends only — humans approve execution.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Fern — User Acquisition Agent</h2>
              <p className="text-sm text-brand-muted">Goal: installs. Fern does not run ads or create content.</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleScan}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Acquisition Scan
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-900">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Top Opportunities" value={stats.totalOpportunities} icon={Lightbulb} />
        <StatCard label="Est. Install Potential" value={stats.totalEstimatedInstalls.toLocaleString()} icon={Download} />
        <StatCard label="Top Score" value={stats.topPriorityScore} icon={TrendingUp} />
        <StatCard label="30d Forecast" value={stats.forecast30d} icon={TrendingUp} />
        <StatCard label="Experiments" value={stats.activeExperiments} icon={FlaskConical} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-brand-border bg-white text-brand-muted hover:border-emerald-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "opportunities" && <OpportunityList opportunities={opportunities} />}
      {tab === "channels" && <AcquisitionChannels opportunities={opportunities} />}
      {tab === "experiments" && <ExperimentTracker experiments={experiments} />}
      {tab === "forecast" && <InstallForecast forecasts={forecasts} />}
    </div>
  );
}
