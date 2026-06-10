import type { CreatorLead, OakPartnerType } from "@/lib/types";

const COLLAB_IDEAS: Record<string, string[]> = {
  influencer: [
    "30-day plant rescue challenge with PlantPal care streak tracking",
    "Affiliate link + unique code for audience — track installs per creator",
    "Co-branded ''plant parent check-in'' live stream series",
  ],
  nursery: [
    "In-store QR on plant tags → PlantPal care plan for each species sold",
    "Co-branded care cards for top 10 nursery sellers",
    "New plant parent bundle: pot + plant + PlantPal onboarding",
  ],
  garden_center: [
    "Seasonal workshop sponsorship with digital care companion for attendees",
    "Weekend demo table — staff helps customers set up PlantPal on-site",
    "Loyalty program integration — points for active PlantPal care streaks",
  ],
  landscaper: [
    "Post-install care handoff — landscaper sets up PlantPal for each client",
    "Before/after transformation series with ongoing care via PlantPal",
    "Referral fee per activated account from landscaping clients",
  ],
  botanical_garden: [
    "Educational workshop bundle — printed guide + PlantPal for attendees",
    "Member exclusive: PlantPal premium trial with garden membership",
    "Kids program partnership — family plant care challenges",
  ],
  brand: [
    "Co-launch product kit with PlantPal as the care layer",
    "Limited edition collaboration — track bundle installs and repeat purchase",
    "Cross-promo email swap to aligned gardening audiences",
  ],
};

const OUTREACH_OPENERS: Record<string, string> = {
  influencer: "Hey {name} — loved your {category} content. PlantPal could power the challenge your audience keeps asking for.",
  nursery: "Hi {name} — PlantPal helps your customers keep plants alive after they leave your nursery.",
  garden_center: "Hi {name} — we help garden centers turn one-time buyers into confident plant parents.",
  landscaper: "Hi {name} — your transformation work is incredible. PlantPal helps clients maintain what you install.",
  botanical_garden: "Hi {name} — PlantPal would love to sponsor your workshops with digital care companions.",
  brand: "Hi {name} — co-launch opportunity: your product design + PlantPal as the retention layer.",
};

function inferPartnerType(lead: CreatorLead): OakPartnerType {
  const cat = lead.category.toLowerCase();
  if (cat.includes("nursery")) return "nursery";
  if (cat.includes("garden center")) return "garden_center";
  if (cat.includes("landscape")) return "landscaper";
  if (cat.includes("botanical")) return "botanical_garden";
  if (cat.includes("brand")) return "brand";
  return "influencer";
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateOutreachDraft(lead: CreatorLead, partnerType: OakPartnerType): string {
  const opener = OUTREACH_OPENERS[partnerType] ?? OUTREACH_OPENERS.influencer;
  const contact = lead.name.split(" ")[0] || lead.handle;
  return opener
    .replace("{name}", contact)
    .replace("{category}", lead.category || "gardening")
    + `\n\nYour ${lead.followers.toLocaleString()} followers and ${lead.engagementRate}% engagement caught our attention. Would you be open to a 15-minute intro call?\n\n— Oak, Partnership Manager @ PlantPal`;
}

export function generateCollaborationIdea(lead: CreatorLead, partnerType: OakPartnerType): string {
  const ideas = COLLAB_IDEAS[partnerType] ?? COLLAB_IDEAS.influencer;
  const seed = lead.partnershipScore + lead.followers;
  return pick(ideas, seed);
}

export function generateFollowUpNote(stage: string): string {
  const notes: Record<string, string> = {
    contacted: "Initial outreach sent — follow up in 5 days if no reply",
    replied: "Review reply and send collaboration one-pager",
    negotiating: "Confirm terms and timeline — legal if needed",
    active: "Mid-campaign check-in — installs and engagement",
    completed: "Archive campaign, plan renewal or case study",
  };
  return notes[stage] ?? "Schedule follow-up";
}

export function daysUntilFollowUp(stage: string): number {
  const days: Record<string, number> = {
    contacted: 5,
    replied: 2,
    negotiating: 3,
    active: 14,
    completed: 30,
  };
  return days[stage] ?? 7;
}

export function buildPipelineFromLead(lead: CreatorLead) {
  const partnerType = inferPartnerType(lead);
  const stage = lead.partnershipStatus === "contacted" ? "contacted" : "contacted";
  return {
    creatorLeadId: lead.id,
    partnerName: lead.name || lead.handle,
    partnerType,
    contactName: lead.name,
    contactEmail: lead.email,
    location: lead.location,
    stage: stage as "contacted",
    outreachDraft: generateOutreachDraft(lead, partnerType),
    collaborationIdea: generateCollaborationIdea(lead, partnerType),
    followUpNote: generateFollowUpNote("contacted"),
    followUpDays: daysUntilFollowUp("contacted"),
    priority: lead.priority,
    notes: `Converted from Scout lead — score ${lead.partnershipScore}, source: ${lead.source}`,
  };
}
