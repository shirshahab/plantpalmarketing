import { createServerClient } from "@/lib/supabase/server";
import {
  TRACKED_COMPETITORS,
  buildDailyBrief,
  pickMockAlerts,
} from "@/lib/agents/sentinel/mock-signals";
import { discoverCompetitorNews } from "@/lib/integrations/providers/serpapi-provider";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { sentinelMonitorCompetitorX } from "@/lib/integrations/agent-integrations";
import { recordHandoff } from "@/lib/collaboration/handoff";

export interface SentinelRunResult {
  competitorsScanned: number;
  alertsGenerated: number;
  briefId: string;
  approvalQueueCount: number;
}

export async function runSentinelAgent(): Promise<SentinelRunResult> {
  const supabase = createServerClient();
  const alerts = shouldShowDemoData()
    ? pickMockAlerts(3)
    : await (async () => {
        const live: ReturnType<typeof pickMockAlerts> = [];
        for (const competitor of TRACKED_COMPETITORS.slice(0, 3)) {
          const news = await discoverCompetitorNews(competitor, "sentinel").catch(() => []);
          for (const item of news.slice(0, 1)) {
            live.push({
              competitor,
              alertType: "viral_post" as const,
              title: item.title.slice(0, 120),
              description: item.snippet.slice(0, 280),
              severity: "medium" as const,
              source: item.link,
              recommendedAction: `Review ${competitor} mention and decide if PlantPal should respond.`,
            });
          }
        }
        return live;
      })();
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

    // Phase 28: every alert creates an Atlas task with a recommended response
    await recordHandoff({
      fromAgent: "sentinel",
      toAgent: "atlas",
      workflowName: "Sentinel → Atlas",
      triggerType: "competitor_alert",
      triggerId: inserted.id,
      taskType: "competitive_response",
      taskDescription: `Assess "${alert.title}" (${alert.competitor}, ${alert.severity} severity). Recommended response: ${alert.recommendedAction}`,
      priority: alert.severity === "high" ? "high" : "medium",
      messageTitle: `Competitor move: ${alert.competitor} — ${alert.title}`,
      messageBody: `${alert.description}\n\nSeverity: ${alert.severity}\nRecommended response: ${alert.recommendedAction}`,
      activityDetail: `Sentinel handed ${alert.competitor} alert to Atlas`,
      metadata: { alert_id: inserted.id, severity: alert.severity },
    });

    // High-severity alerts also reach Ivy directly
    if (alert.severity === "high") {
      await recordHandoff({
        fromAgent: "sentinel",
        toAgent: "ivy",
        workflowName: "Sentinel → Ivy",
        triggerType: "high_severity_alert",
        triggerId: inserted.id,
        taskType: "founder_briefing",
        taskDescription: `Surface "${alert.title}" (${alert.competitor}) in the next executive brief — high severity.`,
        priority: "high",
        messageTitle: `High-severity competitor alert: ${alert.competitor}`,
        messageBody: `${alert.title}\n\n${alert.description}\n\nRecommended: ${alert.recommendedAction}`,
        activityDetail: `Sentinel escalated a high-severity ${alert.competitor} alert to Ivy`,
        metadata: { alert_id: inserted.id },
      });
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
