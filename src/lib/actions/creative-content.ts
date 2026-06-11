"use server";

import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import { generateCreativeIdeasWithOpenAI } from "@/lib/openai/generate-ideas";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { runVoiceCheckOnFields, VOICE_FAIL_REASON, VOICE_PASS_THRESHOLD } from "@/lib/brand/voice-check";

export type GenerateResult =
  | { ok: true; count: number; batchId: string }
  | { ok: false; error: string };

export async function generateCreativeContentBatch(input: {
  count: number;
  contentType?: string;
  format?: string;
  theme?: string;
  batchId?: string;
}): Promise<GenerateResult> {
  if (!isOpenAIConfigured()) {
    return { ok: false, error: "OpenAI not configured. Add OPENAI_API_KEY to .env.local" };
  }

  const batchId = input.batchId ?? randomUUID();
  const count = Math.min(Math.max(input.count, 1), 15);

  try {
    const ideas = await generateCreativeIdeasWithOpenAI({
      count,
      contentType: input.contentType,
      format: input.format,
      theme: input.theme,
    });

    const supabase = createServerClient();
    const rows = ideas.map((idea) => {
      // Phase 35 — Voice Check before ideas land in the review queue.
      const voice = runVoiceCheckOnFields({ hook: idea.hook, body: idea.body, cta: idea.cta });
      const voicePassed = voice.score >= VOICE_PASS_THRESHOLD;
      return {
        title: idea.title,
        content_type: idea.content_type,
        format: idea.format,
        hook: idea.hook,
        emotional_trigger: idea.emotional_trigger,
        why_it_works: voicePassed
          ? idea.why_it_works
          : `${VOICE_FAIL_REASON} (PlantPal score ${voice.score}/10): ${voice.violations.slice(0, 2).join("; ")} — ${idea.why_it_works}`,
        cta: idea.cta,
        difficulty_score: idea.difficulty_score,
        viral_score: idea.viral_score,
        body: idea.body,
        status: voicePassed ? ("pending" as const) : ("rejected" as const),
        generation_batch_id: batchId,
      };
    });

    const { error } = await supabase.from("creative_content_ideas").insert(rows);
    if (error) return { ok: false, error: error.message };

    await revalidateDashboard();
    return { ok: true, count: ideas.length, batchId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Generation failed",
    };
  }
}
