import {
  BANNED_PHRASES,
  BANNED_WORDS,
  GOOD_EXAMPLES,
  VOICE_TEST_QUESTIONS,
  buildBrandVoicePrompt,
  type BrandPlatform,
} from "@/lib/brand/brand-brain";

/**
 * Phase 35 — PlantPal Voice Check.
 *
 * Scores any caption / reply / hook 1-10 against the Brand Brain.
 *   10  = unmistakably PlantPal
 *   8-9 = acceptable → may reach Founder approval
 *   7   = needs revision
 *   ≤6  = automatic rejection
 *
 * Nothing below 8 reaches Founder approval. Failures are sent back to Sage
 * with the reason "Failed PlantPal voice."
 */

export const VOICE_FAIL_REASON = "Failed PlantPal voice";
export const VOICE_PASS_THRESHOLD = 8;

export type VoiceVerdict = "pass" | "needs_revision" | "reject";

export interface VoiceCheckResult {
  score: number;
  verdict: VoiceVerdict;
  passed: boolean;
  violations: string[];
}

const CORPORATE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /helping (plant parents|you|gardeners|people)/i, label: "corporate 'helping…' framing" },
  { pattern: /\bmade (easy|easier|simple)\b/i, label: "'made easy' SaaS framing" },
  { pattern: /\byour (trusted|new|personal) /i, label: "'your trusted/new/personal X' framing" },
  { pattern: /\bwe believe\b/i, label: "'we believe' mission-statement energy" },
  { pattern: /\bfor everyone\b/i, label: "'for everyone' SaaS tagline energy" },
  { pattern: /\bgrow with\b/i, label: "'grow with…' motivational tagline" },
  { pattern: /\bthrive with\b/i, label: "'thrive with…' motivational tagline" },
  { pattern: /\b(discover|explore) (the|a|how)\b/i, label: "generic 'discover/explore' opener" },
  { pattern: /\bwhether you('|’)re\b/i, label: "'whether you're…' AI filler" },
  { pattern: /\b\d+ (tips|ways|reasons|secrets|hacks) (for|to)\b/i, label: "listicle format" },
  { pattern: /next level\b/i, label: "'next level' cliché" },
  { pattern: /\bsay goodbye to\b/i, label: "'say goodbye to' AI cliché" },
  { pattern: /\bin today('|’)s\b/i, label: "'in today's…' AI opener" },
];

/** Markers that copy actually has a pulse. */
const PERSONALITY_MARKERS: RegExp[] = [
  /\b(rip|respect|congratulations|breaking news|hot take|plot twist|crime scene|filed a complaint|restraining order|trust issues|red flag|villain|drama|dramatic|chaos|guilt|betrayal|crying|screaming|unhinged|maniac|swamp|funeral|ghosted|side-eye|judging you)\b/i,
  /\bisn'?t\b[\s\S]*\bit'?s\b/i, // "isn't X. It's Y." reversal
  /\bno[,.] (they|it|she|he|you)/i, // "No, they're not…" correction
  /\bstop\b/i,
  /\?$/m, // direct question to the reader
  /\byou did not\b/i,
  /\bagain\.\s*$/im,
];

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Rule-based voice score — deterministic, free, fast enough to run inside
 * every generation pipeline before content reaches approval.
 */
export function runVoiceCheck(text: string): VoiceCheckResult {
  const violations: string[] = [];
  const clean = (text ?? "").trim();
  if (!clean) {
    return { score: 1, verdict: "reject", passed: false, violations: ["Empty caption"] };
  }
  const lower = clean.toLowerCase();
  let score = 10;

  // 1. Banned words — hard hits
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/ /g, "\\s+")}\\b`, "i");
    if (re.test(lower)) {
      score -= 2;
      violations.push(`Banned word: "${word}"`);
    }
  }

  // 2. Banned phrases / formats — instant corporate
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === "*" ? ".*" : `\\${m}`)), "i");
    if (re.test(lower)) {
      score -= 3;
      violations.push(`Banned format: "${phrase}"`);
    }
  }

  // 3. Corporate / generic-AI patterns
  for (const { pattern, label } of CORPORATE_PATTERNS) {
    if (pattern.test(clean)) {
      score -= 2;
      violations.push(label);
    }
  }

  // 4. Personality requirement — at least one surprising phrase, joke,
  //    observation or opinion. Short punchy sentences count as a pulse.
  const sentences = clean.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const hasShortPunch = sentences.some((s) => wordCount(s) <= 6);
  const hasPersonality = PERSONALITY_MARKERS.some((re) => re.test(clean));
  if (!hasPersonality && !hasShortPunch) {
    score -= 2;
    violations.push("No surprising phrase, joke, observation, or opinion — reads flat");
  }

  // 5. Bloated sentences read like AI
  const longSentences = sentences.filter((s) => wordCount(s) > 28).length;
  if (sentences.length > 0 && longSentences / sentences.length > 0.5) {
    score -= 1;
    violations.push("Sentences run long — PlantPal hits in short bursts");
  }

  score = Math.max(1, Math.min(10, score));
  const verdict: VoiceVerdict = score >= VOICE_PASS_THRESHOLD ? "pass" : score === 7 ? "needs_revision" : "reject";
  return { score, verdict, passed: verdict === "pass", violations };
}

/** Convenience: check several fields at once (hook + caption + cta). */
export function runVoiceCheckOnFields(fields: Record<string, string | undefined>): VoiceCheckResult {
  const combined = Object.values(fields).filter(Boolean).join("\n");
  return runVoiceCheck(combined);
}

export interface AIVoiceCheckResult extends VoiceCheckResult {
  aiUsed: boolean;
  answers?: Record<string, boolean>;
  notes?: string;
}

/**
 * Optional AI judge — runs the four voice-test questions through OpenAI and
 * combines with the rule-based score (the lower of the two wins). Falls back
 * to rules-only when OpenAI is not configured or the call fails.
 */
export async function runVoiceCheckWithAI(
  text: string,
  platform?: BrandPlatform
): Promise<AIVoiceCheckResult> {
  const rules = runVoiceCheck(text);
  try {
    const { isOpenAIConfigured } = await import("@/lib/openai/config");
    if (!isOpenAIConfigured()) return { ...rules, aiUsed: false };

    const { callOpenAIJson } = await import("@/lib/openai/client");
    const system = [
      buildBrandVoicePrompt(platform),
      "",
      "You are PlantPal's ruthless voice editor. Judge the submitted copy.",
      "Reference bar:",
      ...GOOD_EXAMPLES.slice(0, 4).map((e) => `- ${e}`),
      "",
      "Respond with JSON: { \"score\": 1-10, " +
        VOICE_TEST_QUESTIONS.map((q, i) => `"q${i + 1}": boolean /* ${q} */`).join(", ") +
        ", \"notes\": string }",
      "10 = unmistakably PlantPal. 8 = acceptable. 7 = needs revision. 6 or lower = corporate/generic/AI — reject.",
    ].join("\n");

    const ai = await callOpenAIJson<{
      score?: number;
      q1?: boolean;
      q2?: boolean;
      q3?: boolean;
      q4?: boolean;
      notes?: string;
    }>(system, `Copy to judge:\n\n${text.slice(0, 2000)}`, 0.2);

    const aiScore = Math.max(1, Math.min(10, Math.round(Number(ai.score ?? rules.score))));
    const score = Math.min(rules.score, aiScore);
    const verdict: VoiceVerdict = score >= VOICE_PASS_THRESHOLD ? "pass" : score === 7 ? "needs_revision" : "reject";
    const violations = [...rules.violations];
    if (aiScore < VOICE_PASS_THRESHOLD && ai.notes) violations.push(`AI judge: ${ai.notes.slice(0, 200)}`);

    return {
      score,
      verdict,
      passed: verdict === "pass",
      violations,
      aiUsed: true,
      answers: {
        [VOICE_TEST_QUESTIONS[0]]: ai.q1 ?? true,
        [VOICE_TEST_QUESTIONS[1]]: ai.q2 ?? true,
        [VOICE_TEST_QUESTIONS[2]]: ai.q3 ?? true,
        [VOICE_TEST_QUESTIONS[3]]: ai.q4 ?? true,
      },
      notes: ai.notes,
    };
  } catch {
    return { ...rules, aiUsed: false };
  }
}
