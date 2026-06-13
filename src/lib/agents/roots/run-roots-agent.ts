import { createServerClient } from "@/lib/supabase/server";
import { generateMockMentions } from "@/lib/agents/roots/mock-community";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { rootsMonitorXConversations } from "@/lib/integrations/agent-integrations";
import { runVoiceCheck, VOICE_FAIL_REASON, VOICE_PASS_THRESHOLD } from "@/lib/brand/voice-check";
import { recordHandoff } from "@/lib/collaboration/handoff";

export interface RootsRunResult {
  mentionsFound: number;
  opportunitiesCreated: number;
  repliesDrafted: number;
  approvalQueueCount: number;
}

export async function runRootsAgent(): Promise<RootsRunResult> {
  const supabase = createServerClient();
  const xConversations = await rootsMonitorXConversations().catch(() => []);
  const mentions = shouldShowDemoData() ? generateMockMentions(4) : [];

  for (const tweet of xConversations.slice(0, 3)) {
    await supabase.from("community_mentions").insert({
      platform: "X",
      author: tweet.authorUsername || "@x_user",
      content: tweet.text,
      url: `https://x.com/i/web/status/${tweet.tweetId}`,
      sentiment: "neutral",
      processed: true,
    });
    await supabase.from("agent_activity_log").insert({
      agent_id: "roots",
      action: "x_conversation_found",
      detail: `X gardening conversation: "${tweet.text.slice(0, 60)}..."`,
      metadata: { tweet_id: tweet.tweetId },
    });
  }
  let opportunitiesCreated = 0;
  let repliesDrafted = 0;
  const approvalRows: { type: string; channel: string; draft: string; status: string; source_id: string }[] = [];

  for (const m of mentions) {
    const { data: mention, error: mError } = await supabase
      .from("community_mentions")
      .insert({
        platform: m.platform,
        author: m.author,
        content: m.content,
        url: m.url,
        sentiment: m.sentiment,
        processed: true,
      })
      .select("id")
      .single();

    if (mError || !mention) throw new Error(mError?.message ?? "Failed to save mention");

    await supabase.from("agent_activity_log").insert({
      agent_id: "roots",
      action: "found_discussion",
      detail: `Roots found discussion: "${m.content.slice(0, 50)}..."`,
      metadata: { mention_id: mention.id, platform: m.platform },
    });

    const { data: opp, error: oError } = await supabase
      .from("community_opportunities")
      .insert({
        platform: m.platform,
        author: m.author,
        post: m.content,
        topic: m.topic,
        question: m.question,
        sentiment: m.sentiment,
        urgency_score: m.urgencyScore,
        opportunity_score: m.opportunityScore,
        opportunity_type: m.opportunityType,
        suggested_reply: m.reply,
        mention_id: mention.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (oError || !opp) throw new Error(oError?.message ?? "Failed to save opportunity");
    opportunitiesCreated++;

    await supabase.from("agent_activity_log").insert({
      agent_id: "roots",
      action: "found_opportunity",
      detail: `Opportunity scored ${m.opportunityScore} — ${m.topic}`,
      metadata: { opportunity_id: opp.id, urgency: m.urgencyScore },
    });

    // Phase 35 — Voice Check before anything reaches the approval queue.
    // Corporate / robotic replies are rejected automatically and sent to Sage.
    const voice = runVoiceCheck(m.reply);
    const voicePassed = voice.score >= VOICE_PASS_THRESHOLD;

    const { data: draft, error: dError } = await supabase
      .from("community_reply_drafts")
      .insert({
        opportunity_id: opp.id,
        platform: m.platform,
        author: m.author,
        original_content: m.content,
        draft: m.reply,
        status: voicePassed ? "pending" : "rejected",
      })
      .select("id")
      .single();

    if (dError || !draft) throw new Error(dError?.message ?? "Failed to save reply draft");
    repliesDrafted++;

    if (!voicePassed) {
      await supabase.from("agent_activity_log").insert({
        agent_id: "roots",
        action: "voice_check_failed",
        detail: `${VOICE_FAIL_REASON} (${voice.score}/10) — reply for ${m.author} sent to Sage for rewrite`,
        metadata: { draft_id: draft.id, opportunity_id: opp.id, voice_score: voice.score },
      });
      await recordHandoff({
        fromAgent: "roots",
        toAgent: "sage",
        workflowName: "Voice Gate → Sage",
        triggerType: "voice_check_failed",
        triggerId: draft.id,
        taskType: "voice_revision",
        taskDescription: `Community reply failed the PlantPal voice check (${voice.score}/10). Rewrite it: ${voice.violations.slice(0, 2).join("; ")}`,
        priority: "medium",
        messageTitle: `${VOICE_FAIL_REASON} — community reply (${m.platform})`,
        messageBody: `Reply scored ${voice.score}/10.\nViolations: ${voice.violations.join("; ")}\n\nDraft:\n${m.reply}`,
        activityDetail: `Voice gate rejected a community reply (${voice.score}/10) — sent to Sage`,
      });
      continue;
    }

    await supabase.from("agent_activity_log").insert({
      agent_id: "roots",
      action: "drafted_reply",
      detail: `Reply awaiting approval for ${m.author} (PlantPal voice ${voice.score}/10)`,
      metadata: { draft_id: draft.id, opportunity_id: opp.id, voice_score: voice.score },
    });

    approvalRows.push({
      type: "reply",
      channel: m.platform,
      draft: `Reply to ${m.author} (PlantPal voice ${voice.score}/10):\n\n${m.reply}\n\n---\nOriginal: ${m.content}`,
      status: "pending",
      source_id: draft.id,
    });

    // Phase 28: Roots actively hands the content opportunity to Bloom
    await recordHandoff({
      fromAgent: "roots",
      toAgent: "bloom",
      workflowName: "Roots → Bloom",
      triggerType: "community_opportunity",
      triggerId: opp.id,
      taskType: "content_from_community",
      taskDescription: `Create platform-specific content answering: "${m.question || m.topic}". Opportunity score ${m.opportunityScore}. Add a calendar item and asset prompt, then send to Sage.`,
      priority: m.urgencyScore >= 80 ? "high" : "medium",
      messageTitle: `Community question worth content: ${m.topic}`,
      messageBody: `Found on ${m.platform} from ${m.author}:\n"${m.content}"\n\nOpportunity score: ${m.opportunityScore}, urgency: ${m.urgencyScore}.\nDraft reply already prepared — turn this into platform content.`,
      activityDetail: `Roots handed "${m.topic}" to Bloom for content production`,
      metadata: { opportunity_id: opp.id, platform: m.platform, urgency: m.urgencyScore },
    });

    // High-risk public replies escalate to Gate explicitly
    if (m.urgencyScore >= 80) {
      await recordHandoff({
        fromAgent: "roots",
        toAgent: "gate",
        workflowName: "Roots → Gate",
        triggerType: "high_risk_reply",
        triggerId: draft.id,
        taskType: "review_public_reply",
        taskDescription: `High-urgency public reply to ${m.author} on ${m.platform} needs founder review before posting.`,
        priority: "high",
        messageTitle: `High-risk reply awaiting review (${m.platform})`,
        messageBody: `Reply draft for ${m.author}:\n\n${m.reply}\n\nOriginal: ${m.content}`,
        activityDetail: `Roots escalated a high-urgency ${m.platform} reply to Gate`,
        metadata: { draft_id: draft.id, urgency: m.urgencyScore },
      });
    }
  }

  if (approvalRows.length > 0) {
    const { error: aqError } = await supabase.from("approval_queue").insert(approvalRows);
    if (aqError) throw new Error(aqError.message);
  }

  return {
    mentionsFound: mentions.length,
    opportunitiesCreated,
    repliesDrafted,
    approvalQueueCount: approvalRows.length,
  };
}
