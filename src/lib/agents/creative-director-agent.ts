import { callOpenAIJson } from "@/lib/openai/client";
import type { ContentDraft, DirectorScores, ScoredContentDraft } from "@/lib/agents/types";
import { MAX_REWRITES, PASS_THRESHOLD } from "@/lib/agents/types";

const DIRECTOR_SYSTEM = `You are the PlantPal Creative Director — ruthless about quality.

You review content like a top agency CD. Reject anything that sounds like generic ChatGPT marketing.

SCORE each dimension 1-100:
- originality: fresh angle, not templated
- humor: wit, lightness, personality (0 ok if format is serious)
- emotional_impact: makes people feel something
- shareability: would someone send this to a friend?
- educational_value: teaches something real without being boring

RED FLAGS (score below 50 on any, fail overall):
- "Here are X tips"
- Corporate buzzwords (leverage, unlock, dive in)
- Generic plant advice without story
- Obvious AI patterns

Return JSON:
{
  "originality": number,
  "humor": number,
  "emotional_impact": number,
  "shareability": number,
  "educational_value": number,
  "aggregate": number (average of 5, rounded),
  "notes": "1-2 sentences — what's working or what's wrong",
  "passed": boolean (true if aggregate >= 80 and no red flags)
}`;

const REWRITE_SYSTEM = `You are the PlantPal Content Agent doing a rewrite based on Creative Director notes.

Make it more original, emotional, and human. Fix every issue the director flagged.
Keep the same platform and format. Return the improved piece only.

Return JSON:
{
  "hook": "",
  "caption": "",
  "cta": "",
  "viral_score": 1-100
}`;

function avg(scores: number[]) {
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export async function scoreContent(draft: ContentDraft): Promise<DirectorScores> {
  const userPrompt = `Review this content piece:

PLATFORM: ${draft.platform}
FORMAT: ${draft.format}
HOOK: ${draft.hook}
CAPTION: ${draft.caption}
CTA: ${draft.cta}
VIRAL SCORE (agent estimate): ${draft.viral_score}`;

  const result = await callOpenAIJson<DirectorScores & { educational_value?: number }>(
    DIRECTOR_SYSTEM,
    userPrompt,
    0.3
  );

  const scores = {
    originality: result.originality ?? 0,
    humor: result.humor ?? 0,
    emotional_impact: result.emotional_impact ?? 0,
    shareability: result.shareability ?? 0,
    educational_value: result.educational_value ?? 0,
  };

  const aggregate = result.aggregate ?? avg(Object.values(scores));
  const passed = aggregate >= PASS_THRESHOLD && (result.passed ?? aggregate >= PASS_THRESHOLD);

  return {
    ...scores,
    aggregate,
    notes: result.notes ?? "",
    passed,
  };
}

export async function rewriteContent(
  draft: ContentDraft,
  directorNotes: string
): Promise<ContentDraft> {
  const userPrompt = `Rewrite this piece. Director notes: ${directorNotes}

ORIGINAL:
HOOK: ${draft.hook}
CAPTION: ${draft.caption}
CTA: ${draft.cta}`;

  const result = await callOpenAIJson<{
    hook: string;
    caption: string;
    cta: string;
    viral_score: number;
  }>(REWRITE_SYSTEM, userPrompt, 0.95);

  return {
    ...draft,
    hook: result.hook ?? draft.hook,
    caption: result.caption ?? draft.caption,
    cta: result.cta ?? draft.cta,
    viral_score: result.viral_score ?? draft.viral_score,
  };
}

export async function reviewAndRefineContent(
  draft: ContentDraft
): Promise<ScoredContentDraft> {
  let current = { ...draft };
  let rewriteCount = 0;
  let lastScores: DirectorScores | null = null;

  for (let attempt = 0; attempt <= MAX_REWRITES; attempt++) {
    lastScores = await scoreContent(current);

    if (lastScores.passed) {
      return {
        ...current,
        originality_score: lastScores.originality,
        humor_score: lastScores.humor,
        emotional_impact_score: lastScores.emotional_impact,
        shareability_score: lastScores.shareability,
        educational_score: lastScores.educational_value,
        aggregate_score: lastScores.aggregate,
        director_notes: lastScores.notes,
        rewrite_count: rewriteCount,
        status: "pending_review",
      };
    }

    if (attempt < MAX_REWRITES) {
      current = await rewriteContent(current, lastScores.notes);
      rewriteCount++;
    }
  }

  return {
    ...current,
    originality_score: lastScores!.originality,
    humor_score: lastScores!.humor,
    emotional_impact_score: lastScores!.emotional_impact,
    shareability_score: lastScores!.shareability,
    educational_score: lastScores!.educational_value,
    aggregate_score: lastScores!.aggregate,
    director_notes: `Failed after ${MAX_REWRITES} rewrites: ${lastScores!.notes}`,
    rewrite_count: rewriteCount,
    status: "rejected",
  };
}
