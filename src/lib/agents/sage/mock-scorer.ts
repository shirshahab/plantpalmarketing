import type { BloomContentPiece } from "@/lib/types";

export const SAGE_PASS_THRESHOLD = 80;

export interface SageScoreResult {
  originalityScore: number;
  humorScore: number;
  emotionalImpactScore: number;
  shareabilityScore: number;
  storytellingScore: number;
  educationalScore: number;
  aggregateScore: number;
  recommendation: "approve" | "reject";
  rejectionReason: string;
  hookSuggestion: string;
  ctaSuggestion: string;
  storytellingSuggestion: string;
  creativeOpportunity: string;
}

const HOOK_TEMPLATES = [
  "Lead with a specific plant failure moment — not a generic tip list.",
  "Open on the emotional stakes: ''This leaf color means something.''",
  "Pattern interrupt: contradict the most common gardening myth in your niche.",
  "Start mid-crisis: ''Day 3 of yellow leaves and I finally checked…''",
];

const CTA_TEMPLATES = [
  "Swap passive CTA for an action verb: ''Build your care plan'' not ''Learn more''.",
  "Add social proof: ''Join 50k plant parents who stopped guessing.''",
  "Use platform-native CTA: comment keyword, save prompt, or link sticker.",
  "Tie CTA to the hook's tension: ''Fix this before your next watering day.''",
];

const STORY_TEMPLATES = [
  "Three-beat arc: relatable mistake → specific fix → visible payoff.",
  "Show the ''before'' emotion, not just the ''before'' plant photo.",
  "End with transformation proof — timeline, measurement, or harvest flex.",
  "Use one human detail (a name, a window sill, a failed attempt) for authenticity.",
];

const OPPORTUNITY_TEMPLATES = [
  "Repurpose as a carousel — high save potential for educational hooks.",
  "Cross-post to Threads with a contrarian opener for debate-driven reach.",
  "Turn into a duet/stitch prompt — UGC amplification opportunity.",
  "Bundle with a Bloom email idea for full-funnel nurture.",
  "Test as paid social — shareability score supports ad creative.",
];

function clamp(n: number): number {
  return Math.min(100, Math.max(1, Math.round(n)));
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function scoreBloomPiece(piece: BloomContentPiece): SageScoreResult {
  const seed = hash(piece.hook + piece.caption + piece.format);
  const viralBoost = (piece.viralScore - 50) * 0.15;
  const difficultyPenalty = (piece.difficultyScore - 50) * 0.08;

  const hookLen = piece.hook.length;
  const captionLen = piece.caption.length;
  const hasQuestion = piece.hook.includes("?") || piece.caption.includes("?");
  const hasStory = /\b(I|my|before|after|day \d|POV)\b/i.test(piece.hook + piece.caption);
  const hasHumor = /\b(dramatic|panic|killed|oops|hot take|unpopular)\b/i.test(piece.hook + piece.caption);
  const hasEducation = /\b(how|why|step|guide|signs|fix|mistake|science)\b/i.test(piece.hook + piece.caption);

  const originalityScore = clamp(62 + (hookLen > 40 ? 8 : 0) + (seed % 18) + viralBoost - difficultyPenalty);
  const humorScore = clamp(55 + (hasHumor ? 15 : 0) + (seed % 20) + (piece.format.includes("tiktok") ? 8 : 0));
  const emotionalImpactScore = clamp(60 + (hasStory ? 12 : 0) + (hasQuestion ? 6 : 0) + (seed % 16) + viralBoost);
  const shareabilityScore = clamp(58 + (piece.viralScore * 0.25) + (seed % 14) + (piece.format === "x_post" ? 6 : 0));
  const storytellingScore = clamp(55 + (hasStory ? 18 : 0) + (captionLen > 80 ? 8 : 0) + (seed % 15));
  const educationalScore = clamp(58 + (hasEducation ? 16 : 0) + (seed % 17) + (piece.format.includes("blog") ? 10 : 0));

  const aggregateScore = clamp(
    Math.round(
      (originalityScore + humorScore + emotionalImpactScore + shareabilityScore + storytellingScore + educationalScore) / 6
    )
  );

  const recommendation = aggregateScore >= SAGE_PASS_THRESHOLD ? "approve" : "reject";

  const rejectionReason =
    recommendation === "reject"
      ? aggregateScore < 72
        ? "Multiple dimensions below threshold — hook and story lack distinctiveness."
        : aggregateScore < 76
          ? "Solid foundation but storytelling and shareability need sharpening before approval."
          : "Close to passing — originality or emotional impact not strong enough for brand standards."
      : "";

  return {
    originalityScore,
    humorScore,
    emotionalImpactScore,
    shareabilityScore,
    storytellingScore,
    educationalScore,
    aggregateScore,
    recommendation,
    rejectionReason,
    hookSuggestion: pick(HOOK_TEMPLATES, seed),
    ctaSuggestion: pick(CTA_TEMPLATES, seed + 1),
    storytellingSuggestion: pick(STORY_TEMPLATES, seed + 2),
    creativeOpportunity: pick(OPPORTUNITY_TEMPLATES, seed + 3),
  };
}
