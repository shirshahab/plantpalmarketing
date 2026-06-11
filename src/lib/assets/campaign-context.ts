import { generatePlatformCaptions, type PlatformCaptions } from "@/lib/brand/platform-captions";
import { runVoiceCheck } from "@/lib/brand/voice-check";

/**
 * Phase 34/35 — campaign context for image assets.
 * Every generated image carries the WHY: objective, audience, hook, caption,
 * per-platform captions, hashtags, CTA and approval reason, so the founder
 * can make an informed approval decision and the calendar item is
 * publish-ready.
 *
 * Phase 35: all copy is generated through the PlantPal Brand Brain and
 * scored by the voice check — no generic SaaS marketing language.
 *
 * Pure module — safe to import from both server actions and client panels.
 */

export interface CampaignContext {
  objective: string;
  platform: string;
  targetAudience: string;
  hook: string;
  caption: string;
  platformCaptions: PlatformCaptions;
  hashtags: string[];
  cta: string;
  approvalReason: string;
  postingNotes: string;
  voiceScore: number;
}

const BASE_HASHTAGS = ["#PlantPal", "#PlantCare", "#Houseplants"];

const CATEGORY_PRESETS: Record<
  string,
  {
    objective: string;
    platform: string;
    targetAudience: string;
    cta: string;
    hashtags: string[];
    postingNotes: string;
  }
> = {
  social_graphic: {
    objective: "Grow PlantPal's social presence with a scroll-stopping branded graphic",
    platform: "instagram",
    targetAudience: "Home plant owners aged 25–45 scrolling Instagram for plant content",
    cta: "PlantPal knows what your plant is mad about. Free download.",
    hashtags: ["#PlantsOfInstagram", "#PlantParent"],
    postingNotes: "Best between 11am–1pm local. Pair with a question sticker in stories.",
  },
  app_screenshot: {
    objective: "Showcase the PlantPal app experience to drive installs",
    platform: "x",
    targetAudience: "Tech-savvy plant beginners who keep killing 'easy' plants",
    cta: "Scan your plant before it writes its will. PlantPal is free.",
    hashtags: ["#PlantTech", "#PlantTok"],
    postingNotes: "Lead with the feature shown in the screenshot. Reply with App Store link.",
  },
  educational: {
    objective: "Build trust and authority with practical plant care that's actually fun to read",
    platform: "instagram",
    targetAudience: "Beginner plant owners who've been lied to by generic care guides",
    cta: "Save this before your plant stages an intervention 🌱",
    hashtags: ["#PlantTips", "#PlantCare101"],
    postingNotes: "Educational posts perform best as carousels — consider a follow-up slide.",
  },
  before_after: {
    objective: "Prove PlantPal works with a real recovery transformation",
    platform: "instagram",
    targetAudience: "Owners of struggling plants who think it's too late",
    cta: "Your plant can have a redemption arc too. PlantPal, free.",
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
  const { hook, captions } = generatePlatformCaptions({
    title: input.title,
    category: input.category,
  });

  const primaryCaption =
    captions[platform as keyof PlatformCaptions] ?? captions.instagram;
  const voiceScore = runVoiceCheck(`${hook}\n${primaryCaption}\n${preset.cta}`).score;

  return {
    objective: preset.objective,
    platform,
    targetAudience: preset.targetAudience,
    hook,
    caption: primaryCaption,
    platformCaptions: captions,
    hashtags: [...BASE_HASHTAGS, ...preset.hashtags],
    cta: preset.cta,
    approvalReason: `Public brand visual for ${platform} — supports "${preset.objective.toLowerCase()}". Founder sign-off required before it can be scheduled.`,
    postingNotes: preset.postingNotes,
    voiceScore,
  };
}

/** Reads the stored campaign context from asset metadata, building a fallback for legacy packages. */
export function getCampaignContext(meta: Record<string, unknown> | null | undefined): CampaignContext {
  const fallback = buildCampaignContext({
    title: typeof meta?.title === "string" ? meta.title : undefined,
    category: typeof meta?.category === "string" ? meta.category : undefined,
    style: typeof meta?.style === "string" ? meta.style : undefined,
  });

  const stored = meta?.campaign;
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    const c = stored as Partial<CampaignContext>;
    const storedCaptions =
      c.platformCaptions && typeof c.platformCaptions === "object"
        ? (c.platformCaptions as PlatformCaptions)
        : null;
    // Phase 35 — legacy captions written before the voice system get
    // regenerated through the Brand Brain instead of trusted blindly.
    const storedCaptionScore = c.caption ? runVoiceCheck(c.caption).score : 0;
    const useStoredCopy = storedCaptionScore >= 8 && Boolean(storedCaptions);

    return {
      objective: c.objective || fallback.objective,
      platform: c.platform || fallback.platform,
      targetAudience: c.targetAudience || fallback.targetAudience,
      hook: useStoredCopy && c.hook ? c.hook : fallback.hook,
      caption: useStoredCopy && c.caption ? c.caption : fallback.caption,
      platformCaptions: useStoredCopy && storedCaptions ? storedCaptions : fallback.platformCaptions,
      hashtags: Array.isArray(c.hashtags) && c.hashtags.length > 0 ? c.hashtags.map(String) : fallback.hashtags,
      cta: useStoredCopy && c.cta ? c.cta : fallback.cta,
      approvalReason: c.approvalReason || fallback.approvalReason,
      postingNotes: c.postingNotes || fallback.postingNotes,
      voiceScore: useStoredCopy && typeof c.voiceScore === "number" ? c.voiceScore : fallback.voiceScore,
    };
  }
  return fallback;
}
