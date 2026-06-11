/**
 * Phase 30 — PlantPal brand voice checker.
 * Short, direct, funny, edgy, helpful. Liquid Death energy.
 * Rejects: too generic, too long, too corporate, too AI-sounding,
 * em dashes, boring.
 */

export interface VoiceViolation {
  rule: string;
  detail: string;
}

export interface VoiceCheckResult {
  passed: boolean;
  score: number;
  violations: VoiceViolation[];
}

const AI_PHRASES = [
  "in today's fast-paced world",
  "in this article",
  "in this blog post",
  "delve into",
  "delving into",
  "furthermore",
  "moreover",
  "in conclusion",
  "it is important to note",
  "it's important to note",
  "when it comes to",
  "a wide range of",
  "look no further",
  "embark on",
  "unlock the secrets",
  "elevate your",
  "game-changer",
  "whether you're a seasoned",
  "whether you are a seasoned",
  "in the world of",
  "the world of plants",
  "dive into",
  "let's explore",
  "navigating the",
  "harness the power",
  "say goodbye to",
  "take your plant care to the next level",
];

const CORPORATE_PHRASES = [
  "leverage",
  "utilize",
  "synergy",
  "best-in-class",
  "industry-leading",
  "cutting-edge",
  "state-of-the-art",
  "robust solution",
  "holistic approach",
  "optimal results",
  "comprehensive guide",
  "ultimate guide",
];

const GENERIC_OPENERS = [
  "plants are a great way to",
  "houseplants have become increasingly popular",
  "many people love plants",
  "plants bring life to any home",
  "there's nothing quite like",
  "gardening is a rewarding hobby",
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function checkBrandVoice(input: {
  headline: string;
  intro: string;
  sections: { subhead: string; body: string }[];
  faq: { question: string; answer: string }[];
  cta: string;
}): VoiceCheckResult {
  const violations: VoiceViolation[] = [];
  const fullText = [
    input.headline,
    input.intro,
    ...input.sections.flatMap((s) => [s.subhead, s.body]),
    ...input.faq.flatMap((f) => [f.question, f.answer]),
    input.cta,
  ].join("\n");
  const lower = fullText.toLowerCase();
  const wordCount = countWords(fullText);

  // 1. Em dashes — hard ban
  if (fullText.includes("—") || /\w--\w/.test(fullText)) {
    violations.push({ rule: "em dashes", detail: "Em dashes found. Rewrite with periods or commas." });
  }

  // 2. Too long / too short
  if (wordCount > 1000) {
    violations.push({ rule: "too long", detail: `${wordCount} words. Cap is ~900. Cut the fluff.` });
  }
  if (wordCount < 350) {
    violations.push({ rule: "too short", detail: `${wordCount} words. Needs to be a real answer (500-900 words).` });
  }

  // 3. AI-sounding phrases
  const aiHits = AI_PHRASES.filter((p) => lower.includes(p));
  if (aiHits.length > 0) {
    violations.push({ rule: "too AI-sounding", detail: `Banned phrases: ${aiHits.slice(0, 4).join("; ")}` });
  }

  // 4. Corporate language
  const corpHits = CORPORATE_PHRASES.filter((p) => lower.includes(p));
  if (corpHits.length > 0) {
    violations.push({ rule: "too corporate", detail: `Corporate gardening nonsense: ${corpHits.slice(0, 4).join("; ")}` });
  }

  // 5. Generic openers
  const genericHits = GENERIC_OPENERS.filter((p) => lower.includes(p));
  if (genericHits.length > 0) {
    violations.push({ rule: "too generic", detail: `Generic opener detected: "${genericHits[0]}"` });
  }

  // 6. Boring — long sentences, no punch
  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const longSentences = sentences.filter((s) => countWords(s) > 32).length;
  if (sentences.length > 0 && longSentences / sentences.length > 0.3) {
    violations.push({
      rule: "boring",
      detail: `${longSentences} sentences run past 32 words. Short sentences hit harder.`,
    });
  }
  const avgSectionWords =
    input.sections.length > 0
      ? input.sections.reduce((sum, s) => sum + countWords(s.body), 0) / input.sections.length
      : 0;
  if (avgSectionWords > 220) {
    violations.push({ rule: "boring", detail: "Sections are bloated. Tighten each one to the practical answer." });
  }

  const score = Math.max(0, 100 - violations.length * 18);
  return { passed: violations.length === 0, score, violations };
}
