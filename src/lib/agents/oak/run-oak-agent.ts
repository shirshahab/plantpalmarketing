import { buildPipelineFromLead } from "@/lib/agents/oak/mock-generator";
import { mapCreatorLead } from "@/lib/supabase/mappers";
import { createServerClient } from "@/lib/supabase/server";

export interface OakRunResult {
  converted: number;
  outreachQueued: number;
  skipped: number;
}

export async function runOakAgent(): Promise<OakRunResult> {
  const supabase = createServerClient();

  const { data: leads, error: leadsError } = await supabase
    .from("creator_leads")
    .select("*")
    .in("priority", ["high"])
    .order("partnership_score", { ascending: false })
    .limit(10);

  if (leadsError) throw new Error(leadsError.message);

  const { data: existing } = await supabase
    .from("oak_partnership_pipeline")
    .select("creator_lead_id")
    .not("creator_lead_id", "is", null);

  const convertedIds = new Set((existing ?? []).map((r) => r.creator_lead_id));

  let converted = 0;
  let outreachQueued = 0;
  let skipped = 0;

  for (const lead of leads ?? []) {
    if (convertedIds.has(lead.id)) {
      skipped++;
      continue;
    }

    const pipeline = buildPipelineFromLead(mapCreatorLead(lead));

    const followUpAt = new Date();
    followUpAt.setDate(followUpAt.getDate() + pipeline.followUpDays);

    const { data: inserted, error: insertError } = await supabase
      .from("oak_partnership_pipeline")
      .insert({
        creator_lead_id: pipeline.creatorLeadId,
        partner_name: pipeline.partnerName,
        partner_type: pipeline.partnerType,
        contact_name: pipeline.contactName,
        contact_email: pipeline.contactEmail,
        location: pipeline.location,
        stage: pipeline.stage,
        outreach_draft: pipeline.outreachDraft,
        collaboration_idea: pipeline.collaborationIdea,
        follow_up_at: followUpAt.toISOString(),
        follow_up_note: pipeline.followUpNote,
        priority: pipeline.priority,
        notes: pipeline.notes,
        outreach_approved: false,
      })
      .select("id")
      .single();

    if (insertError || !inserted) throw new Error(insertError?.message ?? "Insert failed");

    const { error: aqError } = await supabase.from("approval_queue").insert({
      type: "reply",
      channel: "Partnership",
      draft: `Partnership outreach to ${pipeline.partnerName}:\n\n${pipeline.outreachDraft}`,
      status: "pending",
      source_id: inserted.id,
    });

    if (aqError) throw new Error(aqError.message);

    await supabase
      .from("creator_leads")
      .update({ partnership_status: "outreach_pending" })
      .eq("id", lead.id);

    converted++;
    outreachQueued++;
  }

  if (converted > 0) {
    await supabase.from("agent_activity_log").insert({
      agent_id: "oak",
      action: "leads_converted",
      detail: `Converted ${converted} Scout leads — outreach drafts queued for human approval`,
      metadata: { converted, outreach_queued: outreachQueued },
    });
  }

  return { converted, outreachQueued, skipped };
}
