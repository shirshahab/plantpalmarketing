import { createServerClient } from "@/lib/supabase/server";
import {
  TRACKED_COMPETITORS,
  buildDailyBrief,
  pickMockAlerts,
} from "@/lib/agents/sentinel/mock-signals";
import { sentinelMonitorCompetitorX } from "@/lib/integrations/agent-integrations";

export interface SentinelRunResult {
  competitorsScanned: number;
  alertsGenerated: number;
  briefId: string;
  approvalQueueCount: number;
}

export async function runSentinelAgent(): Promise<SentinelRunResult> {
  const supabase = createServerClient();
  const alerts = pickMockAlerts(3);
  let approvalQueueCount = 0;

  for (const alert of alerts) {
    const { data: inserted, error } = await supabase
      .from("competitor_intel_alerts")
      .insert({
        competitor: alert.competitor,
        alert_type: alert.alertType,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        source: alert.source,
        recommended_action: alert.recommendedAction,
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("agent_activity_log").insert({
      agent_id: "sentinel",
      action: "alert_detected",
      detail: `Sentinel alert: ${alert.competitor} — ${alert.title}`,
      metadata: { alert_id: inserted.id, severity: alert.severity },
    });

    if (alert.severity === "high") {
      const { error: aqError } = await supabase.from("approval_queue").insert({
        type: "content",
        channel: "Strategy",
        draft: `Competitor alert (${alert.competitor}): ${alert.title}\n\n${alert.description}\n\nRecommended: ${alert.recommendedAction}`,
        status: "pending",
        source_id: inserted.id,
      });
      if (aqError) throw new Error(aqError.message);
      approvalQueueCount++;
    }

    const growthDelta = Math.floor(Math.random() * 6) - 2;
    await supabase
      .from("competitor_scoreboard")
      .update({
        estimated_growth: Math.min(100, Math.max(0, 50 + growthDelta)),
        last_scanned_at: new Date().toISOString(),
      })
      .eq("name", alert.competitor);
  }

  for (const name of TRACKED_COMPETITORS) {
    const xIntel = await sentinelMonitorCompetitorX(name).catch(() => []);
    if (xIntel.length > 0) {
      await supabase.from("agent_activity_log").insert({
        agent_id: "sentinel",
        action: "x_competitor_intel",
        detail: `X/Serp intel for ${name}: ${xIntel[0]?.title ?? "update"}`,
        metadata: { competitor: name, hits: xIntel.length },
      });
    }
    await supabase
      .from("competitor_scoreboard")
      .update({ last_scanned_at: new Date().toISOString() })
      .eq("name", name);
  }

  const brief = buildDailyBrief(alerts);
  const { data: briefRow, error: briefError } = await supabase
    .from("competitor_daily_briefs")
    .insert({
      biggest_threat: brief.biggestThreat,
      biggest_opportunity: brief.biggestOpportunity,
      recommended_response: brief.recommendedResponse,
      alerts_count: alerts.length,
      competitors_scanned: TRACKED_COMPETITORS.length,
      status: "completed",
    })
    .select("id")
    .single();

  if (briefError || !briefRow) throw new Error(briefError?.message ?? "Brief failed");

  await supabase.from("agent_activity_log").insert({
    agent_id: "sentinel",
    action: "reporting",
    detail: `Daily brief published — ${alerts.length} new alerts across ${TRACKED_COMPETITORS.length} competitors`,
    metadata: { brief_id: briefRow.id },
  });

  return {
    competitorsScanned: TRACKED_COMPETITORS.length,
    alertsGenerated: alerts.length,
    briefId: briefRow.id,
    approvalQueueCount,
  };
}
