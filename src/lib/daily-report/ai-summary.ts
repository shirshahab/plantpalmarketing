import { invokeIntegration } from "@/lib/integrations/invoke";
import { isOpenAIIntegrationConfigured } from "@/lib/integrations/config";
import { getOpenAIConfig } from "@/lib/openai/config";
import type {
  AgentProductivityEntry,
  AnalyticsSummary,
  ApiUsageSummary,
  WorkflowSummary,
} from "@/lib/daily-report/types";

function buildPrompt(
  productivity: AgentProductivityEntry[],
  workflows: WorkflowSummary,
  analytics: AnalyticsSummary,
  apiUsage: ApiUsageSummary
): string {
  const topAgents = [...productivity]
    .sort((a, b) => b.productivityScore - a.productivityScore)
    .slice(0, 5)
    .map((a) => `${a.name}: score ${a.productivityScore}, ${a.tasksCompleted} tasks done, ${a.outputsGenerated} outputs`)
    .join("\n");

  const blocked = workflows.blocked.map((w) => `${w.workflowName}: ${w.bottleneck}`).join("; ") || "none";
  const active = workflows.active.map((w) => `${w.workflowName} (${w.itemsMoved} items)`).join("; ") || "none";

  return `Write an executive daily report summary for PlantPal's founder. Last 24 hours.

AGENT PRODUCTIVITY (top 5):
${topAgents}

WORKFLOWS ACTIVE: ${active}
WORKFLOWS BLOCKED: ${blocked}

METRICS:
- Approvals pending: ${analytics.approvalQueue.pending}
- Content created: ${analytics.contentCreated.count}
- Creator leads: ${analytics.creatorLeads.found} (${analytics.creatorLeads.highPriority} high priority)
- Community opportunities: ${analytics.communityOpportunities.found}
- Competitor alerts: ${analytics.competitorAlerts.active} (${analytics.competitorAlerts.highSeverity} high severity)
- X engagement 24h: ${analytics.xSocial.engagement24h}
- API calls successful/failed: ${apiUsage.totalSuccessful}/${apiUsage.totalFailed}

Write 3-4 short paragraphs. Tone: clear, direct, strategic — like a Head of Growth briefing a founder. No fluff, no "leverage synergies", no generic AI phrases. Lead with what moved, what's blocked, what needs a human decision today. End with the single highest-ROI move for tomorrow.`;
}

function fallbackSummary(
  productivity: AgentProductivityEntry[],
  workflows: WorkflowSummary,
  analytics: AnalyticsSummary
): string {
  const top = [...productivity].sort((a, b) => b.productivityScore - a.productivityScore)[0];
  const blocked = workflows.blocked.length;
  const leads = analytics.creatorLeads.found;
  const opps = analytics.communityOpportunities.found;
  const pending = analytics.approvalQueue.pending;

  return [
    `Last 24h: ${top?.name ?? "Agents"} led output (${top?.productivityScore ?? 0}/100 productivity).`,
    `${leads} creator leads and ${opps} community opportunities surfaced.`,
    blocked > 0
      ? `${blocked} workflow(s) blocked — likely approval backlog (${pending} pending).`
      : `Pipelines moving; ${pending} items still need human approval.`,
    `Priority: clear Gate/Roots queue, then push top Scout lead to Oak for outreach draft.`,
  ].join(" ");
}

export const OPENAI_KEY_ERROR_MESSAGE =
  "OpenAI API key is invalid or missing. Update OPENAI_API_KEY in Vercel.";

export interface ExecutiveSummaryResult {
  text: string;
  aiUsed: boolean;
  /** Founder-facing note when AI was unavailable. Never crashes the report. */
  aiError: string | null;
}

export async function generateExecutiveSummary(
  productivity: AgentProductivityEntry[],
  workflows: WorkflowSummary,
  analytics: AnalyticsSummary,
  apiUsage: ApiUsageSummary
): Promise<ExecutiveSummaryResult> {
  const prompt = buildPrompt(productivity, workflows, analytics, apiUsage);
  const fallback = fallbackSummary(productivity, workflows, analytics);

  if (!isOpenAIIntegrationConfigured()) {
    return { text: fallback, aiUsed: false, aiError: OPENAI_KEY_ERROR_MESSAGE };
  }

  try {
    const { apiKey, model } = getOpenAIConfig();
    // invokeIntegration logs every attempt (success/error/rate_limited) to integration_logs
    const summary = await invokeIntegration({
      provider: "openai",
      action: "daily_report_summary",
      agentId: "ivy",
      requestSummary: "PlantPal HQ daily report",
      fn: async () => {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are Ivy, Chief of Staff at PlantPal. Write executive briefs for the founder. Direct, operator-style, no corporate filler. Never suggest auto-posting or contacting anyone without approval.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 600,
            temperature: 0.6,
          }),
        });
        if (!res.ok) {
          let detail = "";
          try {
            const body = (await res.json()) as { error?: { message?: string } };
            detail = body.error?.message ?? "";
          } catch {
            /* keep status-only message */
          }
          throw new Error(`OpenAI ${res.status}${detail ? `: ${detail}` : ""}`);
        }
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return json.choices?.[0]?.message?.content?.trim() ?? "";
      },
      summarize: (r) => r.slice(0, 80),
    });
    if (!summary) return { text: fallback, aiUsed: false, aiError: null };
    return { text: summary, aiUsed: true, aiError: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    const isKeyError =
      message.includes("401") ||
      message.toLowerCase().includes("incorrect api key") ||
      message.toLowerCase().includes("invalid api key");
    return {
      text: fallback,
      aiUsed: false,
      aiError: isKeyError ? OPENAI_KEY_ERROR_MESSAGE : `OpenAI unavailable — ${message || "unknown error"}. Using rule-based summary.`,
    };
  }
}
