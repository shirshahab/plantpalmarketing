import { callOpenAIJson } from "@/lib/openai/client";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { buildMemoryPromptBlock } from "@/lib/agents/memory-hints";

export interface CreativeVariant {
  concept: string;
  prompt: string;
}

const TYPE_DIRECTION: Record<string, string> = {
  image: "A single social image. Bold, clean, plant-forward. No cluttered text.",
  video: "A short vertical video concept. Hook in the first 2 seconds.",
  thumbnail: "A YouTube/Shorts thumbnail. One focal point, max 4 words of text, high contrast.",
  carousel: "A multi-frame carousel. Frame 1 is the hook, last frame is the CTA.",
  ugc: "A UGC-style concept. Feels filmed on a phone by a real plant person, not an ad.",
  ad: "A paid ad creative. Clear value prop, PlantPal app visible, one CTA.",
  blog_header: "A wide blog header image. Editorial, calm, no text overlay needed.",
};

const FALLBACK_CONCEPTS: CreativeVariant[] = [
  {
    concept: "Dramatic plant rescue — before/after split with a wilted plant on the left, thriving on the right",
    prompt: "Split-frame photo composition: left side a dramatically wilted houseplant in moody light, right side the same plant lush and thriving in bright natural light, PlantPal green accent color, clean background, no text",
  },
  {
    concept: "Plant in therapy — a houseplant on a tiny couch being diagnosed by the PlantPal app",
    prompt: "Whimsical studio photo: a potted monstera sitting on a miniature therapist couch, a smartphone on a tiny chair showing a plant diagnosis app, soft warm lighting, shallow depth of field, playful but premium",
  },
  {
    concept: "Crime scene humor — chalk outline around a dead plant, 'it didn't have to end this way'",
    prompt: "Overhead photo of a dead houseplant inside a white chalk outline on dark wood floor, dramatic noir lighting, a smartphone with a plant care app beside it like evidence, dark humor, premium photography",
  },
];

/**
 * Phase 31 Step 4 — Fern generates a creative package with multiple variants.
 * Uses OpenAI when configured (steered by Fern's memory of approved/rejected
 * styles), template concepts otherwise.
 */
export async function generateCreativeVariants(
  brief: string,
  projectType: string,
  count: number
): Promise<{ variants: CreativeVariant[]; aiUsed: boolean }> {
  const direction = TYPE_DIRECTION[projectType] ?? TYPE_DIRECTION.image;

  if (!isOpenAIConfigured()) {
    return { variants: FALLBACK_CONCEPTS.slice(0, Math.max(1, count)), aiUsed: false };
  }

  const memoryBlock = await buildMemoryPromptBlock(["fern"]);
  const result = await callOpenAIJson<{ variants: CreativeVariant[] }>(
    `You are Fern, Head of Creative at PlantPal, a plant care app that diagnoses sick plants from a photo.
Brand voice: short, funny, edgy, helpful. Liquid Death energy for plants. Never corporate, never generic stock-photo energy.
Generate distinct creative variants. Each variant needs:
- "concept": one sentence a founder can approve at a glance
- "prompt": a detailed image/video generation prompt (style, composition, lighting, mood)
Return JSON: { "variants": [{ "concept": string, "prompt": string }] }`,
    `Creative type: ${projectType}. Direction: ${direction}\n\nContent brief:\n${brief}\n\nGenerate ${count} clearly different variants.${memoryBlock}`,
    0.95
  );

  const variants = Array.isArray(result.variants) ? result.variants.filter((v) => v.concept && v.prompt) : [];
  if (variants.length === 0) {
    return { variants: FALLBACK_CONCEPTS.slice(0, Math.max(1, count)), aiUsed: false };
  }
  return { variants: variants.slice(0, count), aiUsed: true };
}
