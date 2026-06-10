import { createServerClient } from "@/lib/supabase/server";
import { generateMockMentions } from "@/lib/agents/roots/mock-community";
import { rootsMonitorXConversations } from "@/lib/integrations/agent-integrations";

export interface RootsRunResult {
  mentionsFound: number;
  opportunitiesCreated: number;
  repliesDrafted: number;
  approvalQueueCount: number;
}

export async function runRootsAgent(): Promise<RootsRunResult> {
  const supabase = createServerClient();
  const xConversations = await rootsMonitorXConversations().catch(() => []);
  const mentions = generateMockMentions(4);

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

    const { data: draft, error: dError } = await supabase
      .from("community_reply_drafts")
      .insert({
        opportunity_id: opp.id,
        platform: m.platform,
        author: m.author,
        original_content: m.content,
        draft: m.reply,
        status: "pending",
      })
      .select("id")
      .single();

    if (dError || !draft) throw new Error(dError?.message ?? "Failed to save reply draft");
    repliesDrafted++;

    await supabase.from("agent_activity_log").insert({
      agent_id: "roots",
      action: "drafted_reply",
      detail: `Reply awaiting approval for ${m.author}`,
      metadata: { draft_id: draft.id, opportunity_id: opp.id },
    });

    approvalRows.push({
      type: "reply",
      channel: m.platform,
      draft: `Reply to ${m.author}:\n\n${m.reply}\n\n---\nOriginal: ${m.content}`,
      status: "pending",
      source_id: draft.id,
    });
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
