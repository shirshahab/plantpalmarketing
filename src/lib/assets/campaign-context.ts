/**
 * Phase 34 — campaign context for image assets.
 * Every generated image carries the WHY: objective, audience, caption,
 * hashtags, CTA and approval reason, so the founder can make an informed
 * approval decision and the calendar item is publish-ready.
 *
 * Pure module — safe to import from both server actions and client panels.
 */

export interface CampaignContext {
  objective: string;
  platform: string;
  targetAudience: string;
  caption: string;
  hashtags: string[];
  cta: string;
  approvalReason: string;
  postingNotes: string;
}

const BASE_HASHTAGS = ["#PlantPal", "#PlantCare", "#Houseplants"];

const CATEGORY_PRESETS: Record<
  string,
  {
    objective: string;
    platform: string;
    targetAudience: string;
    cta: string;
    captionLead: string;
    hashtags: string[];
    postingNotes: string;
  }
> = {
  social_graphic: {
    objective: "Grow PlantPal's social presence with a scroll-stopping branded graphic",
    platform: "instagram",
    targetAudience: "Home plant owners aged 25–45 scrolling Instagram for plant inspiration",
    cta: "Try PlantPal free — link in bio",
    captionLead: "Your plants have opinions. PlantPal translates.",
    hashtags: ["#PlantsOfInstagram", "#PlantParent"],
    postingNotes: "Best between 11am–1pm local. Pair with a question sticker in stories.",
  },
  app_screenshot: {
    objective: "Showcase the PlantPal app experience to drive installs",
    platform: "x",
    targetAudience: "Tech-savvy plant beginners who want a simple care routine",
    cta: "Download PlantPal and scan your first plant",
    captionLead: "This is what your plant's health looks like in one glance.",
    hashtags: ["#PlantTech", "#AppLaunch"],
    postingNotes: "Lead with the feature shown in the screenshot. Reply with App Store link.",
  },
  educational: {
    objective: "Build trust and authority by teaching practical plant care",
    platform: "instagram",
    targetAudience: "Beginner plant owners searching for simple, reliable care advice",
    cta: "Save this for later 🌱",
    captionLead: "A 10-second lesson your plants will thank you for.",
    hashtags: ["#PlantTips", "#PlantCare101"],
    postingNotes: "Educational posts perform best as carousels — consider a follow-up slide.",
  },
  before_after: {
    objective: "Prove PlantPal works with a real recovery transformation",
    platform: "instagram",
    targetAudience: "Owners of struggling plants looking for a turnaround story",
    cta: "Rescue your plant with PlantPal",
    captionLead: "From dramatic to thriving — here's the glow-up.",
    hashtags: ["#PlantRescue", "#BeforeAndAfter"],
    postingNotes: "Tag the recovery timeline in the caption (e.g. '3 weeks with PlantPal').",
  },
};

const DEFAULT_PRESET = CATEGORY_PRESETS.social_graphic;

export function buildCampaignContext(input: {
  title?: string;
  category?: string;
  style?: string;
  platform?: string;
}): CampaignContext {
  const preset = CATEGORY_PRESETS[input.category ?? ""] ?? DEFAULT_PRESET;
  const platform = input.platform || preset.platform;
  const title = (input.title ?? "").trim();
  const caption = title ? `${title} — ${preset.captionLead}` : preset.captionLead;

  return {
    objective: preset.objective,
    platform,
    targetAudience: preset.targetAudience,
    caption,
    hashtags: [...BASE_HASHTAGS, ...preset.hashtags],
    cta: preset.cta,
    approvalReason: `Public brand visual for ${platform} — supports "${preset.objective.toLowerCase()}". Founder sign-off required before it can be scheduled.`,
    postingNotes: preset.postingNotes,
  };
}

/** Reads the stored campaign context from asset metadata, building a fallback for legacy packages. */
export function getCampaignContext(meta: Record<string, unknown> | null | undefined): CampaignContext {
  const stored = meta?.campaign;
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    const c = stored as Partial<CampaignContext>;
    const fallback = buildCampaignContext({
      title: typeof meta?.title === "string" ? meta.title : undefined,
      category: typeof meta?.category === "string" ? meta.category : undefined,
    });
    return {
      objective: c.objective || fallback.objective,
      platform: c.platform || fallback.platform,
      targetAudience: c.targetAudience || fallback.targetAudience,
      caption: c.caption || fallback.caption,
      hashtags: Array.isArray(c.hashtags) && c.hashtags.length > 0 ? c.hashtags.map(String) : fallback.hashtags,
      cta: c.cta || fallback.cta,
      approvalReason: c.approvalReason || fallback.approvalReason,
      postingNotes: c.postingNotes || fallback.postingNotes,
    };
  }
  return buildCampaignContext({
    title: typeof meta?.title === "string" ? meta.title : undefined,
    category: typeof meta?.category === "string" ? meta.category : undefined,
    style: typeof meta?.style === "string" ? meta.style : undefined,
  });
}
