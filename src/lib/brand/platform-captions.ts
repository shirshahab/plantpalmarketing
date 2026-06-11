import type { BrandPlatform } from "@/lib/brand/brand-brain";

/**
 * Phase 35 — native caption generation per platform.
 * Five platforms, five different captions — never the same text reused.
 * All copy follows the PlantPal formula: Funny Observation → Plant Insight
 * → Simple Fix, written to pass the voice check by construction.
 */

export type CaptionPlatform = Exclude<BrandPlatform, "reddit">;

export type PlatformCaptions = Record<CaptionPlatform, string>;

interface CaptionSeed {
  observation: string;
  insight: string;
  fix: string;
  xLine: string;
  threadsLine: string;
}

const SEEDS_BY_CATEGORY: Record<string, CaptionSeed[]> = {
  social_graphic: [
    {
      observation: "Your monstera isn't dramatic. You're watering it like a maniac.",
      insight: "Droopy leaves usually mean drowning roots, not thirst.",
      fix: "Let the top two inches of soil dry out before the watering can comes back.",
      xLine: "Your monstera isn't dramatic. You're watering it like a maniac.",
      threadsLine: "Unpopular opinion: your monstera is fine. Your watering schedule is the problem.",
    },
    {
      observation: "Some plants want sunlight. Others want a restraining order.",
      insight: "Scorched leaf edges mean your 'bright indirect light' is a full-sun crime scene.",
      fix: "Pull it three feet back from the window and watch the attitude improve.",
      xLine: "Some plants want sunlight. Others want a restraining order.",
      threadsLine: "Your plant doesn't want a south-facing window. It wants boundaries.",
    },
    {
      observation: "The pothos has adapted. The pothos no longer trusts you.",
      insight: "Six weeks without water and it still grew a new leaf. Out of spite.",
      fix: "Reward the resilience: water when dry, then leave it alone. It's earned that.",
      xLine: "The pothos has adapted. The pothos no longer trusts you.",
      threadsLine: "Pothos owners: that new leaf isn't love. It's a survival tactic.",
    },
  ],
  app_screenshot: [
    {
      observation: "You: 'it just died suddenly.' The plant: filed complaints for six weeks.",
      insight: "Plants broadcast trouble long before the funeral. Most of us just can't read leaf.",
      fix: "Scan it with PlantPal and get the diagnosis before it becomes a eulogy.",
      xLine: "Your plant didn't die suddenly. There were six weeks of warnings. PlantPal reads them.",
      threadsLine: "Hot take: there's no such thing as a plant that 'died overnight.' There were signs. PlantPal reads them.",
    },
    {
      observation: "Congratulations. You watered a cactus. Again.",
      insight: "A cactus drinks like five times a year. Yours is on its third drink this week.",
      fix: "PlantPal tracks who actually needs water — so the cactus can finally rest.",
      xLine: "Congratulations. You watered a cactus. Again.",
      threadsLine: "Confession: most 'plant care' is just overwatering with extra steps. There's an app that stops you.",
    },
  ],
  educational: [
    {
      observation: "Your tomato plant isn't hungry. It's drowning.",
      insight: "Yellow leaves on tomatoes scream overwatering way more often than they ask for fertilizer.",
      fix: "Let the soil dry before your plant files a complaint. Then water deep, not daily.",
      xLine: "Your tomato plant isn't hungry. It's drowning.",
      threadsLine: "Daily tomato watering is a hate crime. Deep and infrequent. That's it. That's the post.",
    },
    {
      observation: "That plant isn't thirsty. It's sending a warning.",
      insight: "Crispy tips mean dry air or salty tap water — not 'more water please.'",
      fix: "Switch to filtered water and mist the air, not the leaves. Watch the threats stop.",
      xLine: "That plant isn't thirsty. It's sending a warning.",
      threadsLine: "Crispy leaf tips are a ransom note, not a watering reminder. Pay in humidity.",
    },
    {
      observation: "Breaking news: overwatering continues its reign of terror.",
      insight: "Root rot kills more houseplants than every pest combined. The watering can is the villain.",
      fix: "Finger test first. Dry two knuckles down? Water. Damp? Walk away.",
      xLine: "Breaking news: overwatering continues its reign of terror.",
      threadsLine: "Local houseplant lobby reports the #1 killer is still the watering can. Investigators stunned.",
    },
  ],
  before_after: [
    {
      observation: "RIP to the basil plant that believed in you. Except this one made it.",
      insight: "Three weeks ago this was a crime scene. Then the watering stopped being a daily event.",
      fix: "Drainage hole, dry-out time, actual sunlight. The glow-up writes itself.",
      xLine: "Three weeks ago: crime scene. Today: thriving. The fix? We stopped watering it to death.",
      threadsLine: "Plant glow-ups are 10% care and 90% the owner finally calming down. Exhibit A:",
    },
    {
      observation: "This pothos has survived three breakups and a landlord. Respect.",
      insight: "From two sad leaves to a full curtain — turns out neglect plus one good repot works wonders.",
      fix: "Fresh soil, bigger pot, water every couple weeks. That's the whole redemption arc.",
      xLine: "This pothos survived three breakups and a landlord. Respect.",
      threadsLine: "Before: two leaves and trust issues. After: a full curtain. Redemption arcs are real.",
    },
  ],
};

const DEFAULT_SEEDS = SEEDS_BY_CATEGORY.social_graphic;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Builds five platform-native captions from one seed.
 * Deterministic per title so regenerating a package keeps copy stable.
 */
export function generatePlatformCaptions(input: {
  title?: string;
  category?: string;
}): { captions: PlatformCaptions; hook: string } {
  const seeds = SEEDS_BY_CATEGORY[input.category ?? ""] ?? DEFAULT_SEEDS;
  const seed = seeds[hashString(input.title ?? "plantpal") % seeds.length];

  return {
    hook: seed.observation,
    captions: {
      // Punchy, screenshot-worthy, short paragraphs.
      instagram: `${seed.observation}\n\n${seed.insight}\n\n${seed.fix}`,
      // Community storytelling, longer form.
      facebook:
        `${seed.observation}\n\n` +
        `We see this one constantly in the PlantPal community. ${seed.insight} ` +
        `The good news: the fix is boring. ${seed.fix}\n\n` +
        `Tell us the truth — how many times did you water this week?`,
      // Short. Sharp. One idea.
      x: seed.xLine,
      // Opinionated, conversational.
      threads: `${seed.threadsLine}\n\n${seed.fix}`,
      // Hook first, humor first, fast.
      tiktok: `${seed.observation} 🌱 ${seed.insight} The fix takes 10 seconds: ${seed.fix}`,
    },
  };
}
