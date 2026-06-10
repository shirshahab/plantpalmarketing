import { runScoutAgent } from "@/lib/agents/scout/run-scout-agent";
import { runRootsAgent } from "@/lib/agents/roots/run-roots-agent";
import { runSentinelAgent } from "@/lib/agents/sentinel/run-sentinel-agent";
import { runBloomAgent } from "@/lib/agents/bloom/run-bloom-agent";
import { runSageAgent } from "@/lib/agents/sage/run-sage-agent";
import { runOakAgent } from "@/lib/agents/oak/run-oak-agent";
import { runIvyAgent } from "@/lib/agents/ivy/run-ivy-agent";
import { runAtlasAgent } from "@/lib/agents/atlas/run-atlas-agent";
import { runEchoAgent } from "@/lib/agents/echo/run-echo-agent";
import { runFernAgent } from "@/lib/agents/fern/run-fern-agent";
import type { SchedulableAgent } from "@/lib/agent-worker/types";

export type AgentRunnerResult = Record<string, unknown>;

type AgentRunnerEntry = {
  run: () => Promise<AgentRunnerResult>;
  countItems: (result: AgentRunnerResult) => number;
};

function sumFields(result: AgentRunnerResult, fields: string[]): number {
  return fields.reduce((acc, f) => acc + (typeof result[f] === "number" ? (result[f] as number) : 0), 0);
}

async function asRecord<T extends object>(fn: () => Promise<T>): Promise<AgentRunnerResult> {
  return (await fn()) as AgentRunnerResult;
}

export const AGENT_RUNNER_REGISTRY: Record<SchedulableAgent, AgentRunnerEntry> = {
  scout: {
    run: () => asRecord(runScoutAgent),
    countItems: (r) => (typeof r.creatorsFound === "number" ? r.creatorsFound : 0),
  },
  roots: {
    run: () => asRecord(runRootsAgent),
    countItems: (r) => sumFields(r, ["mentionsFound", "opportunitiesCreated", "repliesDrafted"]),
  },
  sentinel: {
    run: () => asRecord(runSentinelAgent),
    countItems: (r) => sumFields(r, ["alertsGenerated", "competitorsScanned"]),
  },
  bloom: {
    run: () => asRecord(runBloomAgent),
    countItems: (r) => (typeof r.piecesGenerated === "number" ? r.piecesGenerated : 0),
  },
  sage: {
    run: () => asRecord(runSageAgent),
    countItems: (r) => (typeof r.piecesReviewed === "number" ? r.piecesReviewed : 0),
  },
  oak: {
    run: () => asRecord(runOakAgent),
    countItems: (r) => sumFields(r, ["converted", "outreachQueued"]),
  },
  ivy: {
    run: () => asRecord(runIvyAgent),
    countItems: (r) => sumFields(r, ["recommendationsCount", "alertsCount"]),
  },
  atlas: {
    run: () => asRecord(runAtlasAgent),
    countItems: (r) => sumFields(r, ["recommendationsCount", "experimentsCount", "bottlenecksCount"]),
  },
  echo: {
    run: () => asRecord(runEchoAgent),
    countItems: (r) => sumFields(r, ["feedbackCount", "featureRequestCount", "churnRiskCount", "loveSignalCount"]),
  },
  fern: {
    run: () => asRecord(runFernAgent),
    countItems: (r) => sumFields(r, ["opportunitiesCount", "experimentsCount", "forecastsCount"]),
  },
};
