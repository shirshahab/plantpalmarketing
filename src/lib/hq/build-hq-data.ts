import type { ActivityItem, HQAgentData } from "@/lib/hq/types";
import type { getHQAgentData } from "@/lib/db/scout-roots-queries";
import { slugToHqId, hqIdToSlug, AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { formatDistanceToNow } from "date-fns";

type HQData = Awaited<ReturnType<typeof getHQAgentData>>;

const BASE_AGENTS: Pick<HQAgentData, "id" | "name" | "role" | "station" | "accent" | "character">[] = [
  { id: "publishing", name: "Sprout", role: "Publishing Agent", station: "Schedule Desk", accent: "#65a30d", character: "sprout" },
  { id: "content", name: "Bloom", role: "Content Production Agent", station: "Content Garden", accent: "#e85d9a", character: "bloom" },
  { id: "creative_director", name: "Sage", role: "Creative Director", station: "Review Booth", accent: "#0d9488", character: "sage" },
  { id: "community", name: "Roots", role: "Community Agent", station: "Listening Post", accent: "#6b9b7a", character: "roots" },
  { id: "creator", name: "Scout", role: "Creator Discovery Agent", station: "Talent Desk", accent: "#c9a86c", character: "scout_explorer" },
  { id: "competitor", name: "Sentinel", role: "Competitor Intelligence Agent", station: "Watchtower", accent: "#3d4f5f", character: "sentinel" },
  { id: "partnerships", name: "Oak", role: "Partnership Manager", station: "Partnership Grove", accent: "#92400e", character: "oak" },
  { id: "growth", name: "Atlas", role: "Head of Growth", station: "Growth Observatory", accent: "#0369a1", character: "atlas" },
  { id: "acquisition", name: "Fern", role: "User Acquisition Agent", station: "Growth Greenhouse", accent: "#15803d", character: "fern" },
  { id: "customer_voice", name: "Echo", role: "Voice of Customer Agent", station: "Customer Garden", accent: "#9f1239", character: "echo" },
  { id: "approval", name: "Gate", role: "Approval Agent", station: "Launch Gate", accent: "#2d6a4f", character: "gatekeeper" },
];

const IVY_BASE: Pick<HQAgentData, "id" | "name" | "role" | "station" | "accent" | "character"> = {
  id: "chief_of_staff",
  name: "Ivy",
  role: "Chief of Staff",
  station: "Executive Garden",
  accent: "#5b21b6",
  character: "ivy",
};

export function buildHQAgents(data: HQData): HQAgentData[] {
  const { scoutStats, rootsStats, scoutActivity, rootsActivity, sentinel, bloom, sage, sprout, oak, ivy, atlas, fern, echo } = data;

  const sentinelState =
    (sentinel?.sentinelStats.highSeverityAlerts ?? 0) > 0
      ? "alert_detected"
      : (sentinel?.sentinelStats.alertsToday ?? 0) > 0
        ? "analyzing"
        : sentinel?.dailyBrief
          ? "reporting"
          : "monitoring";

  const sentinelTask =
    sentinelState === "alert_detected"
      ? `${sentinel?.sentinelStats.highSeverityAlerts ?? 0} high-severity alerts require review`
      : `Monitoring 8 competitors — App Store, reviews, features, social, ads`;

  const scoutState = scoutStats.highPriority > 0 ? "analyzing" : scoutStats.foundToday > 0 ? "found_match" : "searching";
  const rootsState =
    rootsStats.pendingApprovals > 0
      ? "awaiting_approval"
      : rootsStats.repliesDrafted > 0
        ? "drafting_reply"
        : rootsStats.opportunitiesFound > 0
          ? "finding_opportunity"
          : "listening";

  const scoutTask =
    scoutState === "found_match"
      ? `Found ${scoutStats.foundToday} creators today — ${scoutStats.highPriority} high priority`
      : `Searching TikTok, YouTube, Instagram, Pinterest, blogs, podcasts`;

  const rootsTask =
    rootsState === "awaiting_approval"
      ? `${rootsStats.pendingApprovals} replies awaiting human approval`
      : rootsState === "drafting_reply"
        ? "Drafting helpful replies — never spammy"
        : "Monitoring Reddit, Threads, X, Facebook Groups, forums";

  const operationalAgents = BASE_AGENTS.map((base) => {
    if (base.id === "creator") {
      return {
        ...base,
        agentState: scoutState,
        status: scoutState === "found_match" ? "approved" : scoutState === "analyzing" ? "reviewing" : "researching",
        currentTask: scoutTask,
        progress: Math.min(95, 30 + scoutStats.foundToday * 3 + scoutStats.highPriority * 5),
        lastUpdate: scoutActivity[0] ? formatDistanceToNow(new Date(scoutActivity[0].createdAt), { addSuffix: true }) : "Idle",
        itemsCreated: scoutStats.totalLeads,
        itemsNeedingReview: scoutStats.highPriority,
        stats: {
          foundToday: scoutStats.foundToday,
          highPriority: scoutStats.highPriority,
          pendingOutreach: scoutStats.pendingOutreach,
          recommendedPartnerships: scoutStats.recommendedPartnerships,
        },
        activity: scoutActivity,
      };
    }
    if (base.id === "competitor" && sentinel) {
      return {
        ...base,
        agentState: sentinelState,
        status:
          sentinelState === "alert_detected"
            ? "needs_attention"
            : sentinelState === "analyzing"
              ? "reviewing"
              : "researching",
        currentTask: sentinelTask,
        progress: Math.min(95, 40 + (sentinel.sentinelStats.activeAlerts ?? 0) * 5),
        lastUpdate: sentinel.sentinelActivity[0]
          ? formatDistanceToNow(new Date(sentinel.sentinelActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: sentinel.sentinelStats.totalAlerts,
        itemsNeedingReview: sentinel.sentinelStats.highSeverityAlerts,
        stats: {
          competitorsTracked: sentinel.sentinelStats.competitorsTracked,
          activeAlerts: sentinel.sentinelStats.activeAlerts,
          alertsToday: sentinel.sentinelStats.alertsToday,
          highSeverityAlerts: sentinel.sentinelStats.highSeverityAlerts,
        },
        activity: sentinel.sentinelActivity,
      };
    }
    if (base.id === "acquisition" && fern) {
      const fernState =
        (fern.fernStats.totalOpportunities ?? 0) > 0
          ? "reporting"
          : (fern.fernStats.activeExperiments ?? 0) > 0
            ? "testing"
            : "analyzing";

      const fernTask =
        fernState === "reporting"
          ? `${fern.fernStats.totalOpportunities} acquisition opportunities — ~${fern.fernStats.totalEstimatedInstalls?.toLocaleString() ?? 0} install potential`
          : fernState === "testing"
            ? `${fern.fernStats.activeExperiments} experiments proposed — awaiting human approval`
            : "Scanning traffic sources for install opportunities";

      return {
        ...base,
        agentState: fernState,
        status: fernState === "reporting" ? "reviewing" : "researching",
        currentTask: fernTask,
        progress: Math.min(95, 30 + (fern.fernStats.totalOpportunities ?? 0) * 5),
        lastUpdate: fern.fernActivity[0]
          ? formatDistanceToNow(new Date(fern.fernActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: fern.fernStats.totalOpportunities,
        itemsNeedingReview: fern.fernStats.activeExperiments,
        stats: {
          totalOpportunities: fern.fernStats.totalOpportunities,
          totalEstimatedInstalls: fern.fernStats.totalEstimatedInstalls,
          forecast30d: fern.fernStats.forecast30d,
          topPriorityScore: fern.fernStats.topPriorityScore,
        },
        activity: fern.fernActivity,
      };
    }
    if (base.id === "customer_voice" && echo) {
      const echoState =
        (echo.echoStats.urgentCount ?? 0) > 0
          ? "reporting"
          : (echo.echoStats.totalFeedback ?? 0) > 0
            ? echo.echoStats.hasDailyReport
              ? "summarizing"
              : "analyzing"
            : "listening";

      const echoTask =
        echoState === "reporting"
          ? `${echo.echoStats.urgentCount} urgent issues — ${echo.echoStats.topFeatureRequest ?? "feature requests"} top demand`
          : echoState === "summarizing"
            ? `${echo.echoStats.totalFeedback} feedback items analyzed — ${echo.echoStats.positivePct}% positive sentiment`
            : echoState === "analyzing"
              ? "Categorizing feedback — pain points, requests, sentiment, churn risks"
              : "Listening across support, reviews, email, community, and social";

      return {
        ...base,
        agentState: echoState,
        status:
          echoState === "reporting"
            ? "needs_attention"
            : echoState === "summarizing"
              ? "reviewing"
              : "researching",
        currentTask: echoTask,
        progress: Math.min(95, 25 + (echo.echoStats.totalFeedback ?? 0) * 4),
        lastUpdate: echo.echoActivity[0]
          ? formatDistanceToNow(new Date(echo.echoActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: echo.echoStats.totalFeedback,
        itemsNeedingReview: echo.echoStats.urgentCount + echo.echoStats.activeChurnRisks,
        stats: {
          totalFeedback: echo.echoStats.totalFeedback,
          urgentCount: echo.echoStats.urgentCount,
          positivePct: echo.echoStats.positivePct,
          topFeatureFrequency: echo.echoStats.topFeatureFrequency,
          activeChurnRisks: echo.echoStats.activeChurnRisks,
          loveSignals: echo.echoStats.loveSignals,
        },
        activity: echo.echoActivity,
      };
    }
    if (base.id === "growth" && atlas) {
      const atlasState =
        (atlas.atlasStats.activeBottlenecks ?? 0) > 2
          ? "analyzing"
          : (atlas.atlasStats.activeExperiments ?? 0) > 0
            ? "testing"
            : atlas.dailyReport
              ? "recommending"
              : "monitoring";

      const atlasTask =
        atlasState === "analyzing"
          ? `${atlas.atlasStats.activeBottlenecks} growth bottlenecks detected — reviewing fixes`
          : atlasState === "testing"
            ? `${atlas.atlasStats.activeExperiments} experiments proposed — awaiting human decision`
            : atlasState === "recommending"
              ? `${atlas.atlasStats.totalUsers?.toLocaleString() ?? 0} users — ${atlas.atlasStats.totalRecommendations} growth recommendations scored`
              : "Monitoring installs, retention, channels — generate growth brief";

      return {
        ...base,
        agentState: atlasState,
        status:
          atlasState === "analyzing"
            ? "needs_attention"
            : atlasState === "recommending"
              ? "reviewing"
              : "researching",
        currentTask: atlasTask,
        progress: Math.min(95, 25 + (atlas.atlasStats.totalRecommendations ?? 0) * 4),
        lastUpdate: atlas.atlasActivity[0]
          ? formatDistanceToNow(new Date(atlas.atlasActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: atlas.atlasStats.totalRecommendations,
        itemsNeedingReview: atlas.atlasStats.activeBottlenecks,
        stats: {
          totalUsers: atlas.atlasStats.totalUsers,
          totalRecommendations: atlas.atlasStats.totalRecommendations,
          activeExperiments: atlas.atlasStats.activeExperiments,
          activeBottlenecks: atlas.atlasStats.activeBottlenecks,
          forecast30d: atlas.atlasStats.forecast30d,
        },
        activity: atlas.atlasActivity,
      };
    }
    if (base.id === "partnerships" && oak) {
      const oakState =
        (oak.oakStats.pendingOutreach ?? 0) > 0
          ? "outreach"
          : (oak.oakStats.negotiatingDeals ?? 0) > 0
            ? "negotiating"
            : (oak.oakStats.activeDeals ?? 0) > 0
              ? "managing"
              : oak.oakStats.total > 0
                ? "reporting"
                : "idle";

      const oakTask =
        oakState === "outreach"
          ? `${oak.oakStats.pendingOutreach} outreach drafts awaiting approval`
          : oakState === "negotiating"
            ? `${oak.oakStats.negotiatingDeals} deals in negotiation`
            : oakState === "managing"
              ? `${oak.oakStats.activeDeals} active partnerships — $${oak.oakStats.totalRevenue.toLocaleString()} revenue`
              : `Convert Scout leads — influencers, nurseries, brands, gardens`;

      return {
        ...base,
        agentState: oakState,
        status:
          oakState === "outreach"
            ? "waiting_for_approval"
            : oakState === "negotiating"
              ? "needs_attention"
              : oakState === "managing"
                ? "approved"
                : "researching",
        currentTask: oakTask,
        progress: Math.min(95, 20 + (oak.oakStats.total ?? 0) * 5),
        lastUpdate: oak.oakActivity[0]
          ? formatDistanceToNow(new Date(oak.oakActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: oak.oakStats.total,
        itemsNeedingReview: oak.oakStats.pendingOutreach,
        stats: {
          total: oak.oakStats.total,
          pendingOutreach: oak.oakStats.pendingOutreach,
          totalRevenue: oak.oakStats.totalRevenue,
          totalInstalls: oak.oakStats.totalInstalls,
          activeDeals: oak.oakStats.activeDeals,
        },
        activity: oak.oakActivity,
      };
    }
    if (base.id === "publishing" && sprout) {
      const sproutState =
        (sprout.sproutStats.waiting ?? 0) > 0
          ? "waiting"
          : (sprout.sproutStats.scheduling ?? 0) > 0
            ? "scheduling"
            : (sprout.sproutStats.ready ?? 0) > 0
              ? "ready"
              : (sprout.sproutStats.published ?? 0) > 0
                ? "published"
                : "idle";

      const sproutTask =
        sproutState === "waiting"
          ? `${sprout.sproutStats.waiting} posts awaiting schedule approval`
          : sproutState === "ready"
            ? `${sprout.sproutStats.ready} posts ready — manual publish only`
            : `Scheduling across Instagram, TikTok, X, Threads, Pinterest, YouTube`;

      return {
        ...base,
        agentState: sproutState,
        status:
          sproutState === "waiting"
            ? "waiting_for_approval"
            : sproutState === "ready"
              ? "approved"
              : sproutState === "scheduling"
                ? "writing"
                : "researching",
        currentTask: sproutTask,
        progress: Math.min(95, 25 + (sprout.sproutStats.total ?? 0) * 4),
        lastUpdate: sprout.sproutActivity[0]
          ? formatDistanceToNow(new Date(sprout.sproutActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: sprout.sproutStats.total,
        itemsNeedingReview: sprout.sproutStats.waiting,
        stats: {
          waiting: sprout.sproutStats.waiting,
          scheduling: sprout.sproutStats.scheduling,
          ready: sprout.sproutStats.ready,
          published: sprout.sproutStats.published,
        },
        activity: sprout.sproutActivity,
      };
    }
    if (base.id === "creative_director" && sage) {
      const sageState =
        (sage.sageStats.awaitingReview ?? 0) > 0
          ? "reviewing"
          : (sage.sageStats.rejectedCount ?? 0) > (sage.sageStats.approvedCount ?? 0)
            ? "rejecting"
            : sage.sageStats.latestBatch
              ? "reporting"
              : "idle";

      const sageTask =
        sageState === "reviewing"
          ? `${sage.sageStats.awaitingReview} Bloom pieces awaiting Creative Director review`
          : sageState === "rejecting"
            ? `${sage.sageStats.rejectedCount} pieces rejected — rewrite suggestions ready`
            : `Scoring originality, humor, emotion, shareability, storytelling, education — pass ≥ 80`;

      return {
        ...base,
        agentState: sageState,
        status:
          sageState === "reviewing"
            ? "reviewing"
            : sageState === "rejecting"
              ? "needs_attention"
              : "researching",
        currentTask: sageTask,
        progress: Math.min(95, 30 + (sage.sageStats.totalReviews ?? 0) * 2),
        lastUpdate: sage.sageActivity[0]
          ? formatDistanceToNow(new Date(sage.sageActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: sage.sageStats.totalReviews,
        itemsNeedingReview: sage.sageStats.awaitingReview,
        stats: {
          awaitingReview: sage.sageStats.awaitingReview,
          approvedCount: sage.sageStats.approvedCount,
          rejectedCount: sage.sageStats.rejectedCount,
          avgAggregateScore: sage.sageStats.avgAggregateScore,
        },
        activity: sage.sageActivity,
      };
    }
    if (base.id === "content" && bloom) {
      const bloomState =
        (bloom.bloomStats.awaitingReview ?? 0) > 0
          ? "queueing"
          : (bloom.bloomStats.generatedToday ?? 0) > 0
            ? "drafting"
            : bloom.latestRun
              ? "reporting"
              : "sourcing";

      const bloomTask =
        bloomState === "queueing"
          ? `${bloom.bloomStats.awaitingReview} pieces with Sage — awaiting Creative Director review`
          : bloomState === "drafting"
            ? `Generated ${bloom.bloomStats.generatedToday} pieces today from Scout, Roots, Sentinel`
            : `Daily target: 39 pieces — routed through Sage before approval`;

      return {
        ...base,
        agentState: bloomState,
        status:
          bloomState === "queueing"
            ? "waiting_for_approval"
            : bloomState === "drafting"
              ? "writing"
              : "researching",
        currentTask: bloomTask,
        progress: Math.min(95, 20 + (bloom.bloomStats.totalPieces ?? 0) * 2),
        lastUpdate: bloom.bloomActivity[0]
          ? formatDistanceToNow(new Date(bloom.bloomActivity[0].createdAt), { addSuffix: true })
          : "Idle",
        itemsCreated: bloom.bloomStats.totalPieces,
        itemsNeedingReview: bloom.bloomStats.awaitingReview,
        stats: {
          pendingQueue: bloom.bloomStats.pendingQueue,
          awaitingReview: bloom.bloomStats.awaitingReview,
          generatedToday: bloom.bloomStats.generatedToday,
          publishedCount: bloom.bloomStats.publishedCount,
          highViralCount: bloom.bloomStats.highViralCount,
        },
        activity: bloom.bloomActivity,
      };
    }
    if (base.id === "community") {
      return {
        ...base,
        agentState: rootsState,
        status:
          rootsState === "awaiting_approval"
            ? "waiting_for_approval"
            : rootsState === "drafting_reply"
              ? "writing"
              : rootsState === "finding_opportunity"
                ? "needs_attention"
                : "researching",
        currentTask: rootsTask,
        progress: Math.min(95, 25 + rootsStats.mentionsToday * 4 + rootsStats.opportunitiesFound * 6),
        lastUpdate: rootsActivity[0] ? formatDistanceToNow(new Date(rootsActivity[0].createdAt), { addSuffix: true }) : "Idle",
        itemsCreated: rootsStats.totalOpportunities,
        itemsNeedingReview: rootsStats.pendingApprovals,
        stats: {
          mentionsToday: rootsStats.mentionsToday,
          opportunitiesFound: rootsStats.opportunitiesFound,
          repliesDrafted: rootsStats.repliesDrafted,
          pendingApprovals: rootsStats.pendingApprovals,
        },
        activity: rootsActivity,
      };
    }

    return {
      ...base,
      status: "paused" as const,
      currentTask: "Standing by — connect agent pipeline to activate",
      progress: 0,
      lastUpdate: "—",
      itemsCreated: 0,
      itemsNeedingReview: 0,
      activity: [],
    };
  });

  const ivyState =
    (ivy?.ivyStats.pendingUrgentAlerts ?? 0) > 0
      ? "prioritizing"
      : (ivy?.ivyStats.totalRecommendations ?? 0) > 0
        ? "reporting"
        : ivy?.dailyBrief
          ? "reviewing"
          : "monitoring";

  const ivyTask =
    ivyState === "prioritizing"
      ? `${ivy?.ivyStats.pendingUrgentAlerts} urgent alerts — prioritizing response order`
      : ivyState === "reporting"
        ? `Morning brief ready — ${ivy?.ivyStats.totalRecommendations} recommendations scored`
        : ivyState === "reviewing"
          ? "Reviewing all agents — Scout, Roots, Sentinel, Bloom, Sage, Sprout, Oak, Gate"
          : "Monitoring PlantPal HQ — generate morning brief to activate";

  const ivyAgent: HQAgentData = {
    ...IVY_BASE,
    agentState: ivyState,
    status: (
      ivyState === "prioritizing"
        ? "needs_attention"
        : ivyState === "reporting"
          ? "approved"
          : ivyState === "reviewing"
            ? "reviewing"
            : "researching"
    ) as HQAgentData["status"],
    currentTask: ivyTask,
    progress: Math.min(95, 30 + (ivy?.ivyStats.totalRecommendations ?? 0) * 4),
    lastUpdate: ivy?.ivyActivity[0]
      ? formatDistanceToNow(new Date(ivy.ivyActivity[0].createdAt), { addSuffix: true })
      : "Idle",
    itemsCreated: ivy?.ivyStats.totalRecommendations ?? 0,
    itemsNeedingReview: ivy?.ivyStats.pendingUrgentAlerts ?? 0,
    stats: {
      totalRecommendations: ivy?.ivyStats.totalRecommendations,
      pendingUrgentAlerts: ivy?.ivyStats.pendingUrgentAlerts,
      activeAlerts: ivy?.ivyStats.activeAlerts,
      topPriorityScore: ivy?.ivyStats.topPriorityScore,
    },
    activity: ivy?.ivyActivity ?? [],
  };

  const allAgents = [ivyAgent, ...operationalAgents] as HQAgentData[];

  if (data.collaboration) {
    const { notificationsByAgent, activeTasks } = data.collaboration;
    const tasksByAgent = activeTasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.assignedAgent] = (acc[t.assignedAgent] ?? 0) + 1;
      return acc;
    }, {});

    return allAgents.map((agent) => {
      const slug = hqIdToSlug(agent.id);
      return {
        ...agent,
        unreadMessages: notificationsByAgent[slug] ?? 0,
        activeTasks: tasksByAgent[slug] ?? 0,
      };
    });
  }

  return allAgents;
}

export function buildHQActivity(data: HQData): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (data.collaboration) {
    for (const event of data.collaboration.events.slice(0, 8)) {
      items.push({
        id: `collab-event-${event.id}`,
        type: "collab_event" as const,
        title: event.title,
        summary: `${event.summary} — Impact: ${event.impact}`.slice(0, 160),
        timestamp: formatDistanceToNow(new Date(event.createdAt), { addSuffix: true }),
        agentId: slugToHqId(event.sourceAgent),
        priority: event.eventType.includes("rejected") || event.eventType.includes("detected") ? "high" as const : "medium" as const,
        entityId: event.id,
      });
    }
    for (const msg of data.collaboration.messages.filter((m) => m.status === "unread").slice(0, 4)) {
      items.push({
        id: `collab-msg-${msg.id}`,
        type: "collab_message" as const,
        title: `${AGENT_SLUG_LABELS[msg.fromAgent]} → ${AGENT_SLUG_LABELS[msg.toAgent]}: ${msg.title}`,
        summary: msg.body.slice(0, 120),
        timestamp: formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }),
        agentId: slugToHqId(msg.toAgent),
        priority: msg.priority === "urgent" ? "high" as const : msg.priority === "high" ? "high" as const : "medium" as const,
        entityId: msg.id,
      });
    }
    for (const task of data.collaboration.activeTasks.slice(0, 4)) {
      items.push({
        id: `collab-task-${task.id}`,
        type: "collab_task" as const,
        title: `Task for ${AGENT_SLUG_LABELS[task.assignedAgent]}: ${task.taskType.replace(/_/g, " ")}`,
        summary: task.description.slice(0, 120),
        timestamp: formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }),
        agentId: slugToHqId(task.assignedAgent),
        priority: task.priority === "urgent" ? "high" as const : task.priority === "high" ? "high" as const : "medium" as const,
        entityId: task.id,
      });
    }
  }

  if (data.echo) {
    if (data.echo.dailyReport) {
      items.push({
        id: `echo-report-${data.echo.dailyReport.id}`,
        type: "echo_voc_report" as const,
        title: "Echo published today's Voice of Customer report",
        summary: data.echo.dailyReport.executiveSummary.slice(0, 120),
        timestamp: formatDistanceToNow(new Date(data.echo.dailyReport.createdAt), { addSuffix: true }),
        agentId: "customer_voice" as const,
        priority: (data.echo.echoStats.urgentCount ?? 0) > 0 ? "high" as const : "medium" as const,
        entityId: data.echo.dailyReport.id,
      });
    }
    for (const feat of data.echo.topFeatureRequests.slice(0, 2)) {
      items.push({
        id: `echo-feat-${feat.id}`,
        type: "echo_feature_request" as const,
        title: `Echo found ${feat.frequency} users requesting ${feat.featureName}`,
        summary: feat.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(feat.createdAt), { addSuffix: true }),
        agentId: "customer_voice" as const,
        priority: feat.priority >= 85 ? "high" as const : "medium" as const,
        entityId: feat.id,
      });
    }
    for (const risk of data.echo.churnRisks.slice(0, 1)) {
      items.push({
        id: `echo-churn-${risk.id}`,
        type: "echo_churn" as const,
        title: `Echo identified churn risk: ${risk.title}`,
        summary: risk.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(risk.createdAt), { addSuffix: true }),
        agentId: "customer_voice" as const,
        priority: risk.severity === "high" ? "high" as const : "medium" as const,
        entityId: risk.id,
      });
    }
    for (const love of data.echo.loveSignals.slice(0, 1)) {
      items.push({
        id: `echo-love-${love.id}`,
        type: "echo_love" as const,
        title: `Echo discovered strong positive sentiment around ${love.feature}`,
        summary: love.quote.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(love.createdAt), { addSuffix: true }),
        agentId: "customer_voice" as const,
        priority: "medium" as const,
        entityId: love.id,
      });
    }
    if (data.echo.sentiment) {
      items.push({
        id: `echo-sentiment-${data.echo.sentiment.id}`,
        type: "echo_sentiment" as const,
        title: `Echo sentiment trend: ${data.echo.sentiment.trendDirection} — ${data.echo.sentiment.positivePct}% positive`,
        summary: data.echo.sentiment.notes ?? "Voice of customer sentiment snapshot",
        timestamp: formatDistanceToNow(new Date(data.echo.sentiment.createdAt), { addSuffix: true }),
        agentId: "customer_voice" as const,
        priority: (data.echo.sentiment.urgentCount ?? 0) > 0 ? "high" as const : "low" as const,
        entityId: data.echo.sentiment.id,
      });
    }
  }

  if (data.fern) {
    for (const opp of data.fern.topOpportunities.slice(0, 3)) {
      items.push({
        id: `fern-opp-${opp.id}`,
        type: "fern_opportunity" as const,
        title: `Fern: ${opp.title}`,
        summary: `~${opp.estimatedInstalls} installs · ${opp.trafficSource} · score ${opp.priorityScore}`,
        timestamp: formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true }),
        agentId: "acquisition" as const,
        priority: opp.priorityScore >= 85 ? "high" as const : "medium" as const,
        entityId: opp.id,
      });
    }
    for (const exp of data.fern.experiments.slice(0, 1)) {
      items.push({
        id: `fern-exp-${exp.id}`,
        type: "fern_experiment" as const,
        title: `Fern recommends: ${exp.name}`,
        summary: exp.hypothesis.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true }),
        agentId: "acquisition" as const,
        priority: "medium" as const,
        entityId: exp.id,
      });
    }
    const pinterestForecast = data.fern.forecasts.find((f) => f.trafficSource === "pinterest");
    if (pinterestForecast) {
      items.push({
        id: `fern-forecast-pinterest`,
        type: "fern_forecast" as const,
        title: `Fern identified Pinterest opportunity worth ${pinterestForecast.predictedInstalls} monthly installs`,
        summary: pinterestForecast.assumptions.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(pinterestForecast.createdAt), { addSuffix: true }),
        agentId: "acquisition" as const,
        priority: "high" as const,
        entityId: pinterestForecast.id,
      });
    }
  }

  if (data.atlas) {
    if (data.atlas.dailyReport) {
      items.push({
        id: `atlas-brief-${data.atlas.dailyReport.id}`,
        type: "atlas_growth_brief" as const,
        title: "Atlas published today's growth brief",
        summary: data.atlas.dailyReport.executiveSummary.slice(0, 120),
        timestamp: formatDistanceToNow(new Date(data.atlas.dailyReport.createdAt), { addSuffix: true }),
        agentId: "growth" as const,
        priority: "high" as const,
        entityId: data.atlas.dailyReport.id,
      });
    }
    for (const rec of data.atlas.topRecommendations.slice(0, 3)) {
      items.push({
        id: `atlas-rec-${rec.id}`,
        type: "atlas_recommendation" as const,
        title: `Atlas recommends: ${rec.title}`,
        summary: rec.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true }),
        agentId: "growth" as const,
        priority: rec.priorityScore >= 80 ? "high" as const : "medium" as const,
        entityId: rec.id,
      });
    }
    for (const exp of data.atlas.experiments.slice(0, 1)) {
      items.push({
        id: `atlas-exp-${exp.id}`,
        type: "atlas_experiment" as const,
        title: `Atlas recommends launching ${exp.name}`,
        summary: exp.expectedOutcome.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true }),
        agentId: "growth" as const,
        priority: "medium" as const,
        entityId: exp.id,
      });
    }
  }

  if (data.ivy) {
    if (data.ivy.dailyBrief) {
      items.push({
        id: `ivy-brief-${data.ivy.dailyBrief.id}`,
        type: "ivy_brief" as const,
        title: "Ivy published morning executive brief",
        summary: data.ivy.dailyBrief.executiveSummary.slice(0, 120),
        timestamp: formatDistanceToNow(new Date(data.ivy.dailyBrief.createdAt), { addSuffix: true }),
        agentId: "chief_of_staff" as const,
        priority: "high" as const,
        entityId: data.ivy.dailyBrief.id,
      });
    }
    for (const rec of data.ivy.topRecommendations.slice(0, 3)) {
      items.push({
        id: `ivy-rec-${rec.id}`,
        type: "ivy_recommendation" as const,
        title: `Ivy recommends: ${rec.title}`,
        summary: rec.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true }),
        agentId: "chief_of_staff" as const,
        priority: rec.priorityScore >= 85 ? "high" as const : "medium" as const,
        entityId: rec.id,
      });
    }
    for (const alert of data.ivy.urgentAlerts.slice(0, 2)) {
      items.push({
        id: `ivy-alert-${alert.id}`,
        type: "ivy_alert" as const,
        title: alert.title,
        summary: alert.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }),
        agentId: "chief_of_staff" as const,
        priority: "high" as const,
        entityId: alert.id,
      });
    }
  }

  for (const lead of data.recentLeads.slice(0, 3)) {
    items.push({
      id: `lead-${lead.id}`,
      type: "scout_found_creator" as const,
      title: `Scout found creator: ${lead.handle}`,
      summary: `${lead.name} — ${lead.followers.toLocaleString()} followers, score ${lead.partnershipScore}`,
      timestamp: formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true }),
      agentId: "creator" as const,
      platform: lead.platform,
      priority: lead.priority === "high" ? "high" as const : "medium" as const,
      entityId: lead.id,
    });
  }

  for (const opp of data.recentOpportunities.slice(0, 2)) {
    items.push({
      id: `opp-${opp.id}`,
      type: "roots_found_discussion" as const,
      title: `Roots found discussion`,
      summary: `"${opp.post.slice(0, 60)}${opp.post.length > 60 ? "…" : ""}"`,
      timestamp: formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true }),
      agentId: "community" as const,
      platform: opp.platform,
      priority: opp.urgencyScore >= 85 ? "high" as const : "medium" as const,
      entityId: opp.id,
    });
  }

  for (const p of data.recommendedPartnerships.slice(0, 2)) {
    items.push({
      id: `part-${p.id}`,
      type: "suggested_partnership" as const,
      title: `Suggested partnership: ${p.title}`,
      summary: p.description.slice(0, 100),
      timestamp: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }),
      agentId: "creator" as const,
      priority: "medium" as const,
      entityId: p.id,
    });
  }

  if (data.bloom) {
    if (data.bloom.latestRun) {
      items.push({
        id: `bloom-run-${data.bloom.latestRun.id}`,
        type: "bloom_batch" as const,
        title: `Bloom daily batch — ${data.bloom.latestRun.piecesGenerated} pieces`,
        summary: `Sent to Sage for review · Scout ${data.bloom.latestRun.scoutInputs} · Roots ${data.bloom.latestRun.rootsInputs} · Sentinel ${data.bloom.latestRun.sentinelInputs}`,
        timestamp: formatDistanceToNow(new Date(data.bloom.latestRun.createdAt), { addSuffix: true }),
        agentId: "content" as const,
        priority: "medium" as const,
        entityId: data.bloom.latestRun.id,
      });
    }
    for (const piece of data.bloom.draftQueue.slice(0, 2)) {
      items.push({
        id: `bloom-${piece.id}`,
        type: "bloom_content_draft" as const,
        title: `Bloom draft: ${piece.platform} — ${piece.hook.slice(0, 50)}`,
        summary: `Viral ${piece.viralScore} · ${piece.emotionalTrigger} · ${piece.sourceType.replace("_", " ")}`,
        timestamp: formatDistanceToNow(new Date(piece.createdAt), { addSuffix: true }),
        agentId: "content" as const,
        priority: piece.viralScore >= 80 ? "high" as const : "medium" as const,
        draft: piece.caption,
        status: "pending" as const,
        entityId: piece.id,
      });
    }
  }

  if (data.sage) {
    if (data.sage.sageStats.latestBatch) {
      const batch = data.sage.sageStats.latestBatch;
      items.push({
        id: `sage-batch-${batch.id}`,
        type: "sage_review_batch" as const,
        title: `Sage reviewed ${batch.piecesReviewed} pieces — avg ${batch.avgAggregateScore}`,
        summary: `${batch.approvedCount} approved, ${batch.rejectedCount} rejected · threshold 80`,
        timestamp: formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true }),
        agentId: "creative_director" as const,
        priority: batch.rejectedCount > 0 ? "high" as const : "medium" as const,
        entityId: batch.id,
      });
    }
    for (const review of data.sage.rejections.slice(0, 2)) {
      items.push({
        id: `sage-reject-${review.id}`,
        type: "sage_rejection" as const,
        title: `Sage rejected: score ${review.aggregateScore}`,
        summary: review.rejectionReason.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
        agentId: "creative_director" as const,
        priority: "medium" as const,
        entityId: review.id,
      });
    }
    for (const review of data.sage.recentReviews.filter((r) => r.recommendation === "approve").slice(0, 1)) {
      items.push({
        id: `sage-approve-${review.id}`,
        type: "sage_approval" as const,
        title: `Sage approved: ${review.piece?.platform} — score ${review.aggregateScore}`,
        summary: review.hookSuggestion.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
        agentId: "creative_director" as const,
        priority: "medium" as const,
        entityId: review.id,
      });
    }
  }

  if (data.oak) {
    for (const deal of data.oak.outreachQueue.slice(0, 2)) {
      items.push({
        id: `oak-outreach-${deal.id}`,
        type: "oak_outreach" as const,
        title: `Oak: outreach draft for ${deal.partnerName}`,
        summary: deal.collaborationIdea.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true }),
        agentId: "partnerships" as const,
        priority: "high" as const,
        entityId: deal.id,
      });
    }
    for (const deal of data.oak.followUps.slice(0, 2)) {
      items.push({
        id: `oak-follow-${deal.id}`,
        type: "oak_follow_up" as const,
        title: `Follow-up: ${deal.partnerName}`,
        summary: deal.followUpNote.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true }),
        agentId: "partnerships" as const,
        priority: "medium" as const,
        entityId: deal.id,
      });
    }
  }

  if (data.sprout) {
    for (const post of data.sprout.queue.slice(0, 2)) {
      items.push({
        id: `sprout-wait-${post.id}`,
        type: "sprout_scheduled" as const,
        title: `Sprout: ${post.platform} awaiting schedule approval`,
        summary: post.recommendedTimeLabel,
        timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
        agentId: "publishing" as const,
        priority: "high" as const,
        entityId: post.id,
      });
    }
    for (const post of data.sprout.readyPosts.slice(0, 2)) {
      items.push({
        id: `sprout-ready-${post.id}`,
        type: "sprout_ready" as const,
        title: `Ready to publish: ${post.platform}`,
        summary: post.scheduledAt ? `Scheduled ${post.scheduledAt.slice(0, 16)}` : post.hook.slice(0, 80),
        timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
        agentId: "publishing" as const,
        priority: "medium" as const,
        entityId: post.id,
      });
    }
  }

  if (data.sentinel) {
    for (const alert of data.sentinel.recentAlerts.slice(0, 3)) {
      items.push({
        id: `intel-${alert.id}`,
        type: alert.alertType === "viral_post" ? "competitor_viral" as const : alert.alertType === "new_feature" ? "competitor_feature" as const : "competitor_alert" as const,
        title: `Sentinel: ${alert.competitor} — ${alert.title}`,
        summary: alert.description.slice(0, 100),
        timestamp: formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }),
        agentId: "competitor" as const,
        priority: alert.severity === "high" ? "high" as const : "medium" as const,
        entityId: alert.id,
      });
    }
    if (data.sentinel.dailyBrief) {
      items.push({
        id: `brief-${data.sentinel.dailyBrief.id}`,
        type: "competitor_brief" as const,
        title: "Sentinel daily brief published",
        summary: `Threat: ${data.sentinel.dailyBrief.biggestThreat.slice(0, 80)}…`,
        timestamp: formatDistanceToNow(new Date(data.sentinel.dailyBrief.createdAt), { addSuffix: true }),
        agentId: "competitor" as const,
        priority: "medium" as const,
        entityId: data.sentinel.dailyBrief.id,
      });
    }
  }

  for (const reply of data.pendingReplies.slice(0, 2)) {
    items.push({
      id: `reply-${reply.id}`,
      type: "reply_awaiting_approval" as const,
      title: "Reply awaiting approval",
      summary: `To ${reply.author}: ${reply.draft.slice(0, 80)}…`,
      timestamp: formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }),
      agentId: "community" as const,
      platform: reply.platform,
      priority: "high" as const,
      draft: reply.draft,
      status: "pending" as const,
      entityId: reply.id,
    });
  }

  return items;
}
