import { runAgentBrain } from "@/lib/agents/ai/agent-brain-engine";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { createServerClient } from "@/lib/supabase/server";
import { generateMockCreators } from "@/lib/agents/scout/mock-creators";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { discoverCreatorsMultiQuery } from "@/lib/integrations/providers/serpapi-provider";
import { isSerpApiConfigured } from "@/lib/integrations/config";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { Json } from "@/lib/supabase/database.types";

export interface ScoutRunResult {
  creatorsFound: number;
  highPriority: number;
  partnershipsRecommended: number;
  approvalQueueCount: number;
  duplicatesSkipped: number;
  leadsAdded: number;
  diagnostics: {
    serpApiKeySet: boolean;
    queriesRan: number;
    resultsReturned: number;
    duplicatesSkipped: number;
    insertSucceeded: number;
    insertFailed: number;
    tableExists: boolean;
    lastRunAt: string;
    failureReason?: string;
  };
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("tiktok.com")) return "TikTok";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("pinterest.com")) return "Pinterest";
  if (u.includes("twitter.com") || u.includes("x.com")) return "X";
  if (u.includes("spotify.com") || u.includes("podcast")) return "Podcasts";
  return "Web";
}

function extractHandle(title: string, url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0) return `@${parts[parts.length - 1].replace(/^@/, "")}`;
  } catch {
    /* ignore */
  }
  return title.split("|")[0]?.trim().slice(0, 40) || "creator";
}

export async function runScoutAgent(): Promise<ScoutRunResult> {
  const startedAt = new Date().toISOString();
  const supabase = createServerClient();
  let tableExists = true;

  const diagnostics: ScoutRunResult["diagnostics"] = {
    serpApiKeySet: isSerpApiConfigured(),
    queriesRan: 0,
    resultsReturned: 0,
    duplicatesSkipped: 0,
    insertSucceeded: 0,
    insertFailed: 0,
    tableExists: true,
    lastRunAt: startedAt,
  };

  if (isOpenAIConfigured()) {
    await runAgentBrain("scout").catch(() => undefined);
  }

  if (shouldShowDemoData()) {
    const creators = generateMockCreators(5);
    diagnostics.resultsReturned = creators.length;
    return insertMockCreators(creators, diagnostics, supabase);
  }

  if (!diagnostics.serpApiKeySet) {
    diagnostics.failureReason = "SERPAPI_KEY not configured — Scout cannot search for creators.";
    await logScoutRun(supabase, diagnostics, 0);
    return emptyResult(diagnostics);
  }

  const discovery = await discoverCreatorsMultiQuery("scout");
  diagnostics.queriesRan = discovery.queriesRun;
  diagnostics.resultsReturned = discovery.results.length;

  if (discovery.results.length === 0) {
    diagnostics.failureReason = "SerpAPI returned zero results for plant creator queries.";
    await logScoutRun(supabase, diagnostics, 0);
    return emptyResult(diagnostics);
  }

  let highPriority = 0;
  let leadsAdded = 0;
  const approvalRows: { type: string; channel: string; draft: string; status: string; source_id: string }[] = [];

  for (const hit of discovery.results.slice(0, 25)) {
    const platform = detectPlatform(hit.link);
    const handle = extractHandle(hit.title, hit.link);
    const name = hit.title.split("|")[0]?.trim().slice(0, 80) || handle;

    const { data: existing } = await supabase
      .from("creator_leads")
      .select("id")
      .or(`website.eq.${hit.link},handle.eq.${handle}`)
      .maybeSingle();

    if (existing) {
      diagnostics.duplicatesSkipped += 1;
      continue;
    }

    const priority = /youtube|tiktok|instagram/i.test(platform) ? "high" : "medium";
    if (priority === "high") highPriority += 1;

    const { data: lead, error: leadError } = await supabase
      .from("creator_leads")
      .insert({
        name,
        handle,
        platform,
        category: "Plant Creator",
        followers: 0,
        engagement_rate: 0,
        average_views: 0,
        location: "",
        email: "",
        website: hit.link,
        partnership_score: priority === "high" ? 82 : 68,
        audience_fit: 75,
        engagement_score: 70,
        posting_frequency: 60,
        content_quality: 72,
        growth_trend: 65,
        partnership_status: priority === "high" ? "high_priority" : "prospect",
        priority,
        source: hit.snippet.slice(0, 120) || "SerpAPI discovery",
        suggested_ideas: [`PlantPal collab with ${name}`],
        notes: hit.snippet.slice(0, 300),
        status: "pending",
      })
      .select("id, handle, partnership_score")
      .single();

    if (leadError || !lead) {
      diagnostics.insertFailed += 1;
      if (leadError?.message.includes("does not exist")) tableExists = false;
      continue;
    }

    diagnostics.insertSucceeded += 1;
    leadsAdded += 1;

    await supabase.from("agent_activity_log").insert({
      agent_id: "scout",
      action: "found_creator",
      detail: `Scout found creator: ${handle} on ${platform}`,
      metadata: { lead_id: lead.id, platform, url: hit.link, source_query: hit.snippet } as Json,
    });

    if (priority === "high") {
      approvalRows.push({
        type: "content",
        channel: platform,
        draft: `Creator lead: ${handle}\n${hit.title}\n${hit.link}\n\n${hit.snippet}`,
        status: "pending",
        source_id: lead.id,
      });

      await recordHandoff({
        fromAgent: "scout",
        toAgent: "oak",
        workflowName: "Scout → Oak",
        triggerType: "creator_lead",
        triggerId: lead.id,
        taskType: "partnership_outreach",
        taskDescription: `Review creator lead ${handle} on ${platform}. Founder approval required before outreach.`,
        priority: "high",
        messageTitle: `New creator lead: ${handle}`,
        messageBody: `${name} on ${platform}\n${hit.link}\n\nFound via: ${hit.snippet}`,
        activityDetail: `Scout handed ${handle} to Oak for partnership review`,
        metadata: { lead_id: lead.id, platform, url: hit.link },
      });
    }
  }

  if (approvalRows.length > 0) {
    await supabase.from("approval_queue").insert(approvalRows);
  }

  diagnostics.tableExists = tableExists;
  if (leadsAdded === 0 && diagnostics.duplicatesSkipped > 0) {
    diagnostics.failureReason = `All ${diagnostics.duplicatesSkipped} results were duplicates already in CRM.`;
  } else if (leadsAdded === 0 && diagnostics.insertFailed > 0) {
    diagnostics.failureReason = `Insert failed ${diagnostics.insertFailed} times. Check creator_leads table.`;
  }

  await logScoutRun(supabase, diagnostics, leadsAdded);

  return {
    creatorsFound: discovery.results.length,
    highPriority,
    partnershipsRecommended: 0,
    approvalQueueCount: approvalRows.length,
    duplicatesSkipped: diagnostics.duplicatesSkipped,
    leadsAdded,
    diagnostics,
  };
}

async function logScoutRun(
  supabase: ReturnType<typeof createServerClient>,
  diagnostics: ScoutRunResult["diagnostics"],
  itemsProcessed: number
) {
  await supabase.from("agent_runs").insert({
    agent_id: "scout",
    status: diagnostics.failureReason && itemsProcessed === 0 ? "failed" : "success",
    trigger_source: "manual",
    started_at: diagnostics.lastRunAt,
    completed_at: new Date().toISOString(),
    items_processed: itemsProcessed,
    error_message: diagnostics.failureReason ?? null,
    result_summary: diagnostics as unknown as Json,
  });
}

function emptyResult(diagnostics: ScoutRunResult["diagnostics"]): ScoutRunResult {
  return {
    creatorsFound: 0,
    highPriority: 0,
    partnershipsRecommended: 0,
    approvalQueueCount: 0,
    duplicatesSkipped: diagnostics.duplicatesSkipped,
    leadsAdded: 0,
    diagnostics,
  };
}

async function insertMockCreators(
  creators: ReturnType<typeof generateMockCreators>,
  diagnostics: ScoutRunResult["diagnostics"],
  supabase: ReturnType<typeof createServerClient>
): Promise<ScoutRunResult> {
  let highPriority = 0;
  let leadsAdded = 0;
  for (const c of creators) {
    if (c.priority === "high") highPriority++;
    const { error } = await supabase.from("creator_leads").insert({
      name: c.name,
      handle: c.handle,
      platform: c.platform,
      category: c.category,
      followers: c.followers,
      engagement_rate: c.engagementRate,
      average_views: c.averageViews,
      location: c.location,
      email: c.email,
      website: c.website,
      partnership_score: c.partnershipScore,
      audience_fit: c.audienceFit,
      engagement_score: c.engagementScore,
      posting_frequency: c.postingFrequency,
      content_quality: c.contentQuality,
      growth_trend: c.growthTrend,
      partnership_status: c.priority === "high" ? "high_priority" : "prospect",
      priority: c.priority,
      source: c.source,
      suggested_ideas: c.ideas.map((i) => i.title),
      notes: c.notes,
      status: "pending",
    });
    if (!error) {
      leadsAdded += 1;
      diagnostics.insertSucceeded += 1;
    } else {
      diagnostics.insertFailed += 1;
    }
  }
  diagnostics.lastRunAt = new Date().toISOString();
  await logScoutRun(supabase, diagnostics, leadsAdded);
  return {
    creatorsFound: creators.length,
    highPriority,
    partnershipsRecommended: 0,
    approvalQueueCount: 0,
    duplicatesSkipped: 0,
    leadsAdded,
    diagnostics,
  };
}
