import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isF5BotConfigured } from "@/lib/integrations/config";
import { runProviderHealthCheck } from "@/lib/integrations/health";
import { getCreativeRoutingHealth } from "@/lib/pipeline/creative-routing-health";
import type { HealthCheckResult } from "@/lib/integrations/types";

export type TrafficLight = "green" | "yellow" | "red";

export interface IntegrationTrafficLight {
  id: string;
  label: string;
  status: TrafficLight;
  message: string;
}

function toLight(result: HealthCheckResult | null, configured: boolean): TrafficLight {
  if (!configured) return "red";
  if (!result) return "yellow";
  if (result.status === "connected") return "green";
  if (result.status === "disconnected") return "yellow";
  return "red";
}

async function cronStatus(): Promise<{ light: TrafficLight; message: string }> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("automation_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { light: "yellow", message: "No cron runs logged yet" };
    const row = data as Record<string, unknown>;
    const status = String(row.status ?? "");
    const at = String(row.completed_at ?? row.started_at ?? "");
    if (status === "success") return { light: "green", message: `Last run OK · ${at}` };
    if (status === "failed") return { light: "red", message: String(row.error_message ?? "Last run failed") };
    return { light: "yellow", message: "Last run incomplete" };
  } catch {
    return { light: "yellow", message: "Cron status unavailable" };
  }
}

async function queueLight(table: string, pendingStatus: string, stallAt: number): Promise<{ light: TrafficLight; waiting: number; message: string }> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("status", pendingStatus);
    if (error) return { light: "red", waiting: 0, message: `${table} unavailable` };
    const waiting = count ?? 0;
    if (waiting === 0) return { light: "yellow", waiting, message: "Queue empty" };
    if (waiting > stallAt) return { light: "yellow", waiting, message: `${waiting} waiting — may be slow` };
    return { light: "green", waiting, message: `${waiting} in queue` };
  } catch {
    return { light: "red", waiting: 0, message: "Check failed" };
  }
}

export async function getIntegrationTrafficLights(): Promise<IntegrationTrafficLight[]> {
  const supabaseOk = isSupabaseConfigured();
  const f5Ok = isF5BotConfigured();

  const [openai, serp, weather, cron, approvalQ, bloomQ, videoQ, imageQ, seoQ, creativeRouting] = await Promise.all([
    runProviderHealthCheck("openai").catch(() => null),
    runProviderHealthCheck("serpapi").catch(() => null),
    runProviderHealthCheck("openweather").catch(() => null),
    cronStatus(),
    queueLight("approval_queue", "pending", 15),
    queueLight("content_pipeline", "approved", 20),
    queueLight("video_generation_queue", "pending", 25),
    queueLight("image_prompts", "pending", 60),
    queueLight("seo_blog_posts", "draft", 15),
    getCreativeRoutingHealth(),
  ]);

  return [
    {
      id: "f5bot",
      label: "F5Bot",
      status: f5Ok ? "green" : "red",
      message: f5Ok ? "Feed configured" : "F5BOT_JSON_FEED_URL missing",
    },
    {
      id: "openai",
      label: "OpenAI",
      status: toLight(openai, Boolean(process.env.OPENAI_API_KEY)),
      message: openai?.message ?? "Not checked",
    },
    {
      id: "supabase",
      label: "Supabase",
      status: supabaseOk ? "green" : "red",
      message: supabaseOk ? "Connected" : "Supabase env missing",
    },
    {
      id: "serpapi",
      label: "SerpAPI",
      status: toLight(serp, Boolean(process.env.SERPAPI_KEY)),
      message: serp?.message ?? "Not configured",
    },
    {
      id: "weather",
      label: "Weather",
      status: toLight(weather, Boolean(process.env.OPENWEATHER_API_KEY)),
      message: weather?.message ?? "Not configured",
    },
    {
      id: "cron",
      label: "Cron",
      status: cron.light,
      message: cron.message,
    },
    {
      id: "approval",
      label: "Approval Queue",
      status: approvalQ.light,
      message: approvalQ.message,
    },
    {
      id: "bloom",
      label: "Bloom",
      status: bloomQ.light,
      message: bloomQ.message,
    },
    {
      id: "video",
      label: "Video Studio",
      status: videoQ.light,
      message: videoQ.message,
    },
    {
      id: "image",
      label: "Image Studio",
      status: imageQ.light,
      message: imageQ.message,
    },
    {
      id: "seo",
      label: "SEO Factory",
      status: seoQ.light,
      message: seoQ.message,
    },
    {
      id: "creative-routing",
      label: "Creative Routing",
      status: creativeRouting.status === "healthy" ? "green" : "red",
      message: creativeRouting.message,
    },
  ];
}
