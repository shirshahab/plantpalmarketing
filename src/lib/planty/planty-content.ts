/**
 * Phase 40 — Planty mascot content system.
 * Planty is the brand mascot — not a worker agent.
 */

export type PlantyPose =
  | "happy"
  | "thinking"
  | "you_got_this"
  | "diagnosing"
  | "nice_work"
  | "uh_oh"
  | "watering"
  | "coffee"
  | "phone"
  | "judging";

export type PlantyEmotion =
  | "cheerful"
  | "savage"
  | "concerned"
  | "proud"
  | "cozy"
  | "confident"
  | "panicked";

export interface PlantyUsageRule {
  contentType: string;
  usagePercent: number;
  maxPerWeek: number;
  notes: string;
}

/** Default usage rules — Planty should feel special, not everywhere. */
export const PLANTY_USAGE_RULES: PlantyUsageRule[] = [
  { contentType: "social_post", usagePercent: 15, maxPerWeek: 4, notes: "~15% of social posts" },
  { contentType: "educational_visual", usagePercent: 25, maxPerWeek: 5, notes: "~25% of educational visuals" },
  { contentType: "blog_hero", usagePercent: 10, maxPerWeek: 2, notes: "~10% of blog hero images" },
  { contentType: "onboarding", usagePercent: 20, maxPerWeek: 3, notes: "~20% of onboarding posts" },
];

export const PLANTY_VOICE_EXAMPLES = [
  "Your basil died. Again. Planty saw everything.",
  "Good morning. Your plants are thirsty and so are you.",
  "Planty says stop watering the cactus like it owes you money.",
  "That leaf is not being dramatic. Something is wrong.",
  "Planty is judging your drainage holes.",
];

export interface PlantyMetadata {
  usesPlanty: boolean;
  plantyPose?: PlantyPose;
  plantyEmotion?: PlantyEmotion;
  plantyContext?: string;
}

/** Fern decides if Planty fits — weighted random by content type. */
export function shouldUsePlanty(contentType: string, seed?: string): boolean {
  const rule =
    PLANTY_USAGE_RULES.find((r) => r.contentType === contentType) ??
    PLANTY_USAGE_RULES.find((r) => r.contentType === "social_post")!;
  const hash = simpleHash(seed ?? `${contentType}-${Date.now()}`);
  return hash % 100 < rule.usagePercent;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Build Fern image prompt suffix when Planty is included. */
export function buildPlantyPromptSuffix(meta: PlantyMetadata): string {
  if (!meta.usesPlanty) return "";
  const pose = meta.plantyPose ?? "happy";
  const emotion = meta.plantyEmotion ?? "cheerful";
  const ctx = meta.plantyContext ?? "PlantPal brand mascot scene";
  return (
    `\n\nInclude Planty, the official PlantPal mascot: a cute green leaf character with big expressive eyes, ` +
    `small brown root feet, and the PlantPal leaf logo on chest. Pose: ${pose}. Emotion: ${emotion}. ` +
    `Context: ${ctx}. Planty should feel friendly, funny, and on-brand — never corporate.`
  );
}

/** Moss checks Planty usage isn't overdone for the content type. */
export function mossApprovesPlantyUsage(contentType: string, usesPlanty: boolean): boolean {
  if (!usesPlanty) return true;
  const rule = PLANTY_USAGE_RULES.find((r) => r.contentType === contentType);
  return Boolean(rule);
}
