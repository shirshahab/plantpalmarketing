import type { collectDailyReportData } from "@/lib/daily-report/collector";
import type {
  ActionItemEntry,
  ActionPlan,
  AgentProductivityEntry,
  ApiUsageSummary,
  ContentReport,
  ExecutiveSummaryStructured,
  FounderReview,
  FounderReviewItem,
  GrowthReport,
  GrowthUpgradeRecommendation,
  WorkflowSummary,
} from "@/lib/daily-report/types";

type RawData = Awaited<ReturnType<typeof collectDailyReportData>>;

// ============ 4. Content Report ============

export function buildContentReport(data: RawData): ContentReport {
  const bloomCount = data.bloomContent.connected ? (data.bloomContent.data as unknown[]).length : 0;
  return {
    created: bloomCount,
    approved: data.approval.approved.count,
    rejected: data.approval.rejected.count,
    scheduled: data.calendarScheduled.count,
    missingAssets: data.calendarMissingAssets.count,
    readyToPublish: data.calendarReady.count,
    topOpportunities: data.topOpps.connected ? (data.topOpps.data as string[]) : [],
    connected: data.bloomContent.connected || data.calendarCreated.connected,
  };
}

// ============ 5. Growth Report ============

export function buildGrowthReport(
  data: RawData,
  growthRecs: GrowthUpgradeRecommendation[]
): GrowthReport {
  return {
    creatorLeads: data.creatorLeads.count,
    highPriorityLeads: data.creatorHigh.count,
    partnershipOpportunities: data.partnershipsRec.count,
    communityOpportunities: data.communityOpps.count,
    competitorAlerts: data.competitorAlerts.count,
    highSeverityAlerts: data.competitorHigh.count,
    recommendedMoves: growthRecs.slice(0, 4).map((r) => `${r.title} — ${r.nextStep}`),
    connected: data.creatorLeads.connected || data.communityOpps.connected,
  };
}

// ============ 1. Executive Summary (structured) ============

export function buildExecutiveStructured(
  data: RawData,
  productivity: AgentProductivityEntry[],
  workflows: WorkflowSummary,
  content: ContentReport,
  growth: GrowthReport,
  apiUsage: ApiUsageSummary,
  aiError: string | null
): ExecutiveSummaryStructured {
  const topAgent = [...productivity].sort((a, b) => b.productivityScore - a.productivityScore)[0];
  const moved = workflows.all.reduce((s, w) => s + w.itemsMoved, 0);

  const whatHappened = `${content.created} content pieces produced, ${content.approved} approved, ${growth.creatorLeads} creator leads and ${growth.communityOpportunities} community opportunities found. ${moved} items moved through ${workflows.active.length + workflows.completed.length} active pipelines. ${data.agentRuns24h.count} agent runs, ${apiUsage.totalSuccessful} successful API calls.`;

  let biggestWin = "Quiet day — pipelines ran without incident.";
  if (content.readyToPublish > 0) {
    biggestWin = `${content.readyToPublish} fully-prepared posts are ready to publish — captions, scripts, and checklists done. Publishing is now a copy/paste job.`;
  } else if (growth.highPriorityLeads > 0) {
    biggestWin = `Scout surfaced ${growth.highPriorityLeads} high-priority creator leads — warm outreach candidates waiting in the queue.`;
  } else if (content.approved > 0) {
    biggestWin = `${content.approved} pieces cleared approval — the content engine is producing publishable work.`;
  } else if (topAgent && topAgent.productivityScore >= 60) {
    biggestWin = `${topAgent.name} led output at ${topAgent.productivityScore}/100 productivity.`;
  }

  let biggestRisk = "No material risk in the last 24h.";
  if (apiUsage.totalFailed > 0) {
    const worst = apiUsage.providers.filter((p) => p.failed > 0).sort((a, b) => b.failed - a.failed)[0];
    biggestRisk = `${apiUsage.totalFailed} API failures — worst: ${worst?.provider ?? "unknown"}${worst?.lastErrorMessage ? ` (${worst.lastErrorMessage})` : ""}. Agents degrade to fallbacks while this persists.`;
  } else if (workflows.blocked.length > 0) {
    biggestRisk = `${workflows.blocked.length} pipeline(s) blocked: ${workflows.blocked.map((w) => w.workflowName).join(", ")}. Content sits idle until cleared.`;
  } else if (content.missingAssets > 0) {
    biggestRisk = `${content.missingAssets} approved posts are stuck without assets — approved work that isn't shipping.`;
  } else if (growth.highSeverityAlerts > 0) {
    biggestRisk = `${growth.highSeverityAlerts} high-severity competitor alerts need a response decision.`;
  }

  const needsAttention: string[] = [];
  if (aiError) needsAttention.push(aiError);
  if (data.approval.pending.count > 0)
    needsAttention.push(`${data.approval.pending.count} items waiting in the approval queue.`);
  if (data.xQueuePending.count > 0)
    needsAttention.push(`${data.xQueuePending.count} X posts waiting for Sage/Gate review.`);
  if (data.xQueueReady.count > 0)
    needsAttention.push(`${data.xQueueReady.count} X posts approved — one click from publishing.`);
  if (content.missingAssets > 0)
    needsAttention.push(`${content.missingAssets} calendar items need assets before they can ship.`);
  if (data.batchHighRisk.count > 0)
    needsAttention.push(`${data.batchHighRisk.count} high-risk items in the batch inbox need your explicit call.`);
  if (needsAttention.length === 0)
    needsAttention.push("Nothing urgent. Review the growth moves below and pick one.");

  return { whatHappened, biggestWin, biggestRisk, needsAttention: needsAttention.slice(0, 5), aiError };
}

// ============ 8. Action Items (3 per category) ============

function pad(items: ActionItemEntry[], fillers: ActionItemEntry[]): ActionItemEntry[] {
  const out = [...items];
  for (const f of fillers) {
    if (out.length >= 3) break;
    if (!out.some((i) => i.title === f.title)) out.push(f);
  }
  return out.slice(0, 3);
}

export function buildActionPlan(
  data: RawData,
  workflows: WorkflowSummary,
  apiUsage: ApiUsageSummary,
  content: ContentReport,
  growth: GrowthReport,
  aiError: string | null
): ActionPlan {
  const urgent: ActionItemEntry[] = [];
  const growthActions: ActionItemEntry[] = [];
  const contentActions: ActionItemEntry[] = [];
  const system: ActionItemEntry[] = [];

  // Urgent
  if (aiError) {
    urgent.push({
      title: "Fix the OpenAI API key",
      ownerAgent: "ivy",
      priority: "urgent",
      impactScore: 90,
      nextStep: "Update OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.",
      category: "urgent",
    });
  }
  if (data.approval.pending.count > 0) {
    urgent.push({
      title: `Clear ${data.approval.pending.count} pending approvals`,
      ownerAgent: "gate",
      priority: "urgent",
      impactScore: 85,
      nextStep: "Open /automation → Review Today's Work → approve all low-risk, decide the rest.",
      category: "urgent",
    });
  }
  if (data.xQueueReady.count > 0) {
    urgent.push({
      title: `Publish ${data.xQueueReady.count} approved X posts`,
      ownerAgent: "sprout",
      priority: "high",
      impactScore: 80,
      nextStep: "Open /calendar, click each ready X post, hit Publish to X.",
      category: "urgent",
    });
  }
  for (const wf of workflows.blocked) {
    urgent.push({
      title: `Unblock ${wf.workflowName}`,
      ownerAgent: wf.agentsInvolved[0],
      priority: "high",
      impactScore: 75,
      nextStep: wf.recommendedFix,
      category: "urgent",
    });
  }

  // Growth
  if (growth.highPriorityLeads > 0) {
    growthActions.push({
      title: `Review ${growth.highPriorityLeads} high-priority creator leads`,
      ownerAgent: "scout",
      priority: "high",
      impactScore: 80,
      nextStep: "Open /creators, sort by partnership score, approve outreach for the top 2.",
      category: "growth",
    });
  }
  if (growth.communityOpportunities > 0) {
    growthActions.push({
      title: `Answer ${Math.min(growth.communityOpportunities, 3)} community questions`,
      ownerAgent: "roots",
      priority: "medium",
      impactScore: 70,
      nextStep: "Approve the prepared Roots reply drafts — high-urgency threads first.",
      category: "growth",
    });
  }
  if (growth.highSeverityAlerts > 0) {
    growthActions.push({
      title: "Respond to competitor moves",
      ownerAgent: "sentinel",
      priority: "high",
      impactScore: 72,
      nextStep: "Read the high-severity alerts on /competitors and pick one counter-move.",
      category: "growth",
    });
  }
  if (growth.partnershipOpportunities > 0) {
    growthActions.push({
      title: `Advance ${growth.partnershipOpportunities} partnership ideas`,
      ownerAgent: "oak",
      priority: "medium",
      impactScore: 68,
      nextStep: "Review Oak's drafted partnership concepts and approve the strongest one.",
      category: "growth",
    });
  }

  // Content
  if (content.missingAssets > 0) {
    contentActions.push({
      title: `Create ${content.missingAssets} missing assets`,
      ownerAgent: "bloom",
      priority: "high",
      impactScore: 78,
      nextStep: "Open /calendar → Assets needed today → use the asset prompts to generate or shoot them.",
      category: "content",
    });
  }
  if (content.readyToPublish > 0) {
    contentActions.push({
      title: `Ship ${content.readyToPublish} ready-to-publish posts`,
      ownerAgent: "sprout",
      priority: "high",
      impactScore: 82,
      nextStep: "Copy captions from the calendar drawer and post manually — then mark as posted.",
      category: "content",
    });
  }
  if (data.bloomAwaiting.count > 0) {
    contentActions.push({
      title: `Run Sage on ${data.bloomAwaiting.count} unreviewed pieces`,
      ownerAgent: "sage",
      priority: "medium",
      impactScore: 65,
      nextStep: "Trigger Sage from /agent-operations so scored content reaches the approval queue.",
      category: "content",
    });
  }
  if (content.topOpportunities.length > 0) {
    contentActions.push({
      title: "Brief Bloom on today's top opportunity",
      ownerAgent: "bloom",
      priority: "medium",
      impactScore: 60,
      nextStep: `Point Bloom at: "${content.topOpportunities[0]}".`,
      category: "content",
    });
  }

  // System
  for (const p of apiUsage.providers) {
    if (p.failed > 0 && system.length < 3) {
      system.push({
        title: `Fix ${p.provider} integration (${p.failed} failures)`,
        ownerAgent: "ivy",
        priority: p.provider === "openai" ? "urgent" : "medium",
        impactScore: p.provider === "openai" ? 85 : 60,
        nextStep: p.lastErrorMessage
          ? `Last error: ${p.lastErrorMessage}. Check the key/quota on /integrations and re-test.`
          : "Run Test Connection on /integrations and check the env vars.",
        category: "system",
      });
    }
  }
  if (!data.calendarCreated.connected) {
    system.push({
      title: "Run the content calendar migrations",
      ownerAgent: "ivy",
      priority: "medium",
      impactScore: 70,
      nextStep: "Run supabase/migrations/043 + 044 in the Supabase SQL Editor.",
      category: "system",
    });
  }
  if (!data.xData) {
    system.push({
      title: "Connect X read access",
      ownerAgent: "sprout",
      priority: "medium",
      impactScore: 65,
      nextStep: "Add X_BEARER_TOKEN in Vercel so analytics and the X pipeline go live.",
      category: "system",
    });
  }

  // Evergreen fillers keep each list at exactly 3 without inventing fake urgency
  return {
    urgent: pad(urgent, [
      { title: "Review today's batch inbox", ownerAgent: "gate", priority: "medium", impactScore: 60, nextStep: "Open /automation and run Daily Automation to collect new work.", category: "urgent" },
      { title: "Spot-check the content calendar", ownerAgent: "sprout", priority: "medium", impactScore: 55, nextStep: "Open /calendar week view — confirm the next 3 days look right.", category: "urgent" },
      { title: "Scan agent failures", ownerAgent: "ivy", priority: "low", impactScore: 50, nextStep: "Check /agent-operations for failed runs in the last 24h.", category: "urgent" },
    ]),
    growth: pad(growthActions, [
      { title: "Run Scout for fresh creator leads", ownerAgent: "scout", priority: "medium", impactScore: 62, nextStep: "Trigger Scout from /agent-operations and review tomorrow's list.", category: "growth" },
      { title: "Mine Reddit for plant-parent pain points", ownerAgent: "roots", priority: "medium", impactScore: 58, nextStep: "Run Roots and skim the top community opportunities.", category: "growth" },
      { title: "Refresh competitor watchlist", ownerAgent: "sentinel", priority: "low", impactScore: 50, nextStep: "Run Sentinel and check for new feature launches.", category: "growth" },
    ]),
    content: pad(contentActions, [
      { title: "Generate tomorrow's content batch", ownerAgent: "bloom", priority: "medium", impactScore: 64, nextStep: "Run Bloom from /agent-operations — drafts auto-land on the calendar.", category: "content" },
      { title: "Queue next week's X posts", ownerAgent: "sprout", priority: "medium", impactScore: 58, nextStep: "Approve drafts in the X queue so Sprout can slot best times.", category: "content" },
      { title: "Review rejected content for patterns", ownerAgent: "sage", priority: "low", impactScore: 45, nextStep: "Skim /agents/rejected — tighten Bloom's brief if a pattern shows.", category: "content" },
    ]),
    system: pad(system, [
      { title: "Run a full integration health check", ownerAgent: "ivy", priority: "low", impactScore: 50, nextStep: "Click Test All Connections on /integrations.", category: "system" },
      { title: "Verify cron schedules fired", ownerAgent: "ivy", priority: "low", impactScore: 48, nextStep: "Check /agent-operations run history for the overnight window.", category: "system" },
      { title: "Confirm Supabase migrations are current", ownerAgent: "ivy", priority: "low", impactScore: 45, nextStep: "Compare supabase/MIGRATIONS.md against your SQL editor history.", category: "system" },
    ]),
  };
}

// ============ 9. Founder Review ============

export function buildFounderReview(data: RawData): FounderReview {
  const items: FounderReviewItem[] = [];

  if (data.approval.pending.count > 0) {
    items.push({
      label: `${data.approval.pending.count} items need approval`,
      detail: "Approval queue — Sage-approved content waiting on your decision.",
      kind: "approval",
    });
  }
  if (data.xQueuePending.count > 0) {
    items.push({
      label: `${data.xQueuePending.count} X posts in review`,
      detail: "Waiting in Sage/Gate review on the X pipeline.",
      kind: "approval",
    });
  }
  if (data.calendarReady.count > 0) {
    items.push({
      label: `${data.calendarReady.count} posts ready to publish`,
      detail: "Complete publishing packages on the calendar — copy/paste or one click.",
      kind: "publish",
    });
  }
  if (data.xQueueReady.count > 0) {
    items.push({
      label: `${data.xQueueReady.count} X posts ready for the final click`,
      detail: "Fully approved — publish from the calendar drawer.",
      kind: "publish",
    });
  }
  if (data.outreachPending.count > 0) {
    items.push({
      label: `${data.outreachPending.count} creator outreach drafts awaiting approval`,
      detail: "No outreach is ever sent without your sign-off.",
      kind: "outreach",
    });
  }
  if (data.batchHighRisk.count > 0) {
    items.push({
      label: `${data.batchHighRisk.count} high-risk items in the batch inbox`,
      detail: "Public replies, Reddit comments, or brand-sensitive content.",
      kind: "high_risk",
    });
  }
  if (data.replyDrafts.count > 0) {
    items.push({
      label: `${data.replyDrafts.count} community reply drafts pending`,
      detail: "Roots replies — high-urgency threads decay fast.",
      kind: "high_risk",
    });
  }

  return {
    needingApproval: data.approval.pending.count + data.xQueuePending.count,
    readyToPublish: data.calendarReady.count + data.xQueueReady.count,
    outreachAwaiting: data.outreachPending.count,
    highRisk: data.batchHighRisk.count + data.replyDrafts.count,
    items,
    connected: data.approval.pending.connected,
  };
}
