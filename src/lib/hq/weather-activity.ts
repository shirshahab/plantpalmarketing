import type { WorkflowChoreography } from "@/lib/hq/activity-to-choreography";
import { AGENT_WORLD_POSITIONS } from "@/lib/hq/hq-world-layout";
import type { ActivityItem } from "@/lib/hq/types";
import type { HQWeatherState } from "@/lib/hq/hq-weather";

export function buildWeatherActivityItem(weather: HQWeatherState): ActivityItem | null {
  if (!weather.live) return null;

  const id = `weather-signal-${weather.condition}-${Math.round(weather.temperature)}`;
  return {
    id,
    type: "collab_event",
    title: weather.gardening_tip,
    summary: `${weather.location} · ${weather.label} · ${weather.gardening_tip}`,
    timestamp: new Date().toISOString(),
    agentId: weather.isRaining || weather.humidity > 75 ? "community" : "content",
    status: "approved",
    priority: weather.isRaining || weather.condition === "storm" ? "high" : "medium",
  };
}

export function buildWeatherWorkflows(weather: HQWeatherState): WorkflowChoreography[] {
  if (!weather.live) return [];

  const workflows: WorkflowChoreography[] = [];
  const ivyHome = AGENT_WORLD_POSITIONS.chief_of_staff.home;
  const bloomHome = AGENT_WORLD_POSITIONS.content.home;
  const rootsHome = AGENT_WORLD_POSITIONS.community.home;

  if (weather.isRaining || weather.humidity > 75 || weather.condition === "drizzle") {
    workflows.push({
      step: {
        agentId: "chief_of_staff",
        from: ivyHome,
        to: rootsHome,
        durationMs: 3600,
        state: "handoff",
        label: "OpenWeather → Roots: rainy community care",
        pauseMs: 2000,
      },
      sourceAgentId: "chief_of_staff",
      targetAgentId: "community",
      sourceZoneId: "executive_garden",
      targetZoneId: "listening_post",
      workflowName: "openweather_to_roots",
      pathLabel: "Rain signal → Roots",
      feedLabel: "OpenWeather routed rainy-day engagement to Roots",
      triggerType: "activity",
      triggerId: `weather-roots-${weather.condition}-${Date.now()}`,
    });
  }

  if (
    weather.condition === "clear" ||
    (weather.temperature >= 75 && weather.humidity < 50) ||
    weather.temperature > 85
  ) {
    workflows.push({
      step: {
        agentId: "chief_of_staff",
        from: ivyHome,
        to: bloomHome,
        durationMs: 3600,
        state: "handoff",
        label: "OpenWeather → Bloom: watering content",
        pauseMs: 2000,
      },
      sourceAgentId: "chief_of_staff",
      targetAgentId: "content",
      sourceZoneId: "executive_garden",
      targetZoneId: "content_garden",
      workflowName: "openweather_to_bloom",
      pathLabel: "Dry heat signal → Bloom",
      feedLabel: "OpenWeather routed warm dry conditions to Bloom",
      triggerType: "activity",
      triggerId: `weather-bloom-${weather.condition}-${Date.now()}`,
    });
  }

  return workflows;
}

export function mergeWeatherActivity(
  activity: ActivityItem[],
  weather: HQWeatherState
): ActivityItem[] {
  const item = buildWeatherActivityItem(weather);
  if (!item) return activity;
  if (activity.some((a) => a.id === item.id || a.title === item.title)) return activity;
  return [item, ...activity];
}
