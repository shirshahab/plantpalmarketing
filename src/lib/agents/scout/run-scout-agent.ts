import { runAgentBrain } from "@/lib/agents/ai/agent-brain-engine";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { createServerClient } from "@/lib/supabase/server";
import { generateMockCreators } from "@/lib/agents/scout/mock-creators";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { scoutDiscoverCreatorsOnX } from "@/lib/integrations/agent-integrations";
import { recordHandoff } from "@/lib/collaboration/handoff";

export interface ScoutRunResult {
  creatorsFound: number;
  highPriority: number;
  partnershipsRecommended: number;
  approvalQueueCount: number;
  duplicatesSkipped: number;
  leadsAdded: number;
}

export async function runScoutAgent(): Promise<ScoutRunResult> {
  if (isOpenAIConfigured()) {
    await runAgentBrain("scout");
  }

  const supabase = createServerClient();
  const xCreators = await scoutDiscoverCreatorsOnX().catch(() => []);
  const creators = shouldShowDemoData() ? generateMockCreators(5) : [];

  for (const hit of xCreators.slice(0, 2)) {
    await supabase.from("agent_activity_log").insert({
      agent_id: "scout",
      action: "x_creator_discovery",
      detail: `SerpAPI/X discovery: ${hit.title}`,
      metadata: { link: hit.link },
    });
  }
  let highPriority = 0;
  let partnershipsRecommended = 0;
  const approvalRows: { type: string; channel: string; draft: string; status: string; source_id: string }[] = [];

  for (const c of creators) {
    if (c.priority === "high") highPriority++;

    const { data: lead, error: leadError } = await supabase
      .from("creator_leads")
      .insert({
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
      })
      .select("id, handle, partnership_score")
      .single();

    if (leadError || !lead) throw new Error(leadError?.message ?? "Failed to save creator lead");

    await supabase.from("agent_activity_log").insert({
      agent_id: "scout",
      action: "found_creator",
      detail: `Scout found creator: ${c.handle} — partnership score ${c.partnershipScore}`,
      metadata: { lead_id: lead.id, platform: c.platform },
    });

    for (const idea of c.ideas) {
      const { data: partnership, error: pError } = await supabase
        .from("creator_partnerships")
        .insert({
          creator_lead_id: lead.id,
          title: idea.title,
          idea_type: idea.ideaType,
          description: idea.description,
          status: "recommended",
        })
        .select("id, title")
        .single();

      if (!pError && partnership) {
        partnershipsRecommended++;
        await supabase.from("agent_activity_log").insert({
          agent_id: "scout",
          action: "partnership_idea",
          detail: `Suggested partnership: ${idea.title}`,
          metadata: { partnership_id: partnership.id, lead_id: lead.id },
        });

        if (c.priority === "high") {
          approvalRows.push({
            type: "content",
            channel: c.platform,
            draft: `Partnership: ${idea.title}\nCreator: ${c.handle} (${c.name})\nScore: ${c.partnershipScore}\n\n${idea.description}`,
            status: "pending",
            source_id: partnership.id,
          });
        }
      }
    }

    if (c.priority === "high") {
      approvalRows.push({
        type: "content",
        channel: c.platform,
        draft: `High-priority creator lead: ${c.handle}\nScore: ${c.partnershipScore}\nCategory: ${c.category}\nFollowers: ${c.followers.toLocaleString()}\n\nSuggested outreach: ${c.ideas[0]?.title ?? "Partnership collab"}`,
        status: "pending",
        source_id: lead.id,
      });

      // Phase 28: Scout actively hands the lead to Oak for partnership work
      await recordHandoff({
        fromAgent: "scout",
        toAgent: "oak",
        workflowName: "Scout → Oak",
        triggerType: "creator_lead",
        triggerId: lead.id,
        taskType: "partnership_outreach",
        taskDescription: `Build a partnership package for ${c.handle} (${c.name}) — score ${c.partnershipScore}, ${c.followers.toLocaleString()} followers on ${c.platform}. Draft outreach and send to Gate for approval.`,
        priority: "high",
        messageTitle: `New high-priority creator: ${c.handle}`,
        messageBody: `Scout found ${c.name} (${c.handle}) on ${c.platform}.\nPartnership score: ${c.partnershipScore}\nCategory: ${c.category}\nSuggested angle: ${c.ideas[0]?.title ?? "Partnership collab"}\n\nGenerate an outreach idea and partnership package, then route to Gate.`,
        activityDetail: `Scout handed ${c.handle} to Oak for partnership outreach`,
        metadata: { lead_id: lead.id, platform: c.platform, score: c.partnershipScore },
      });
    }
  }

  if (approvalRows.length > 0) {
    const { error: aqError } = await supabase.from("approval_queue").insert(approvalRows);
    if (aqError) throw new Error(aqError.message);
  }

  return {
    creatorsFound: creators.length,
    highPriority,
    partnershipsRecommended,
    approvalQueueCount: approvalRows.length,
    duplicatesSkipped: 0,
    leadsAdded: creators.length,
  };
}
