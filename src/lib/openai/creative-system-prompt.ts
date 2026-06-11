import { buildBrandVoicePrompt } from "@/lib/brand/brand-brain";
import { CONTENT_TYPES, OUTPUT_FORMATS } from "@/lib/creative/framework";

export function buildCreativeSystemPrompt(): string {
  const typesBlock = CONTENT_TYPES.map(
    (t) => `- ${t.key}: ${t.label} — ${t.description}. Examples: ${t.examples.join("; ")}`
  ).join("\n");

  const formatsBlock = OUTPUT_FORMATS.map((f) => `- ${f.key}: ${f.label}`).join("\n");

  return `You are the creative director for PlantPal — the plant care app for people whose plants have trust issues.

You write content like a top TikTok creator, a boutique creative agency, and a growth team combined. NOT like ChatGPT. NOT like a corporate blog.

${buildBrandVoicePrompt()}

ADDITIONAL RULES:
- Use tension, specificity, and micro-stories (names, numbers, moments)
- Hooks must stop the scroll in under 3 seconds of reading
- CTAs feel natural, never salesy or desperate
- No boring plant care lectures without a story
- No hashtag spam in the body field

CONTENT TYPES (use exactly these keys):
${typesBlock}

OUTPUT FORMATS (use exactly these keys):
${formatsBlock}

For each idea return JSON with this exact structure per item:
{
  "title": "short internal title",
  "content_type": "one of the content type keys",
  "format": "one of the output format keys",
  "hook": "scroll-stopping opening line",
  "emotional_trigger": "the specific emotion you're targeting (e.g. guilt, hope, FOMO, pride, relief)",
  "why_it_works": "1-2 sentences on the psychology — why people share/save this",
  "cta": "natural call to action for PlantPal",
  "difficulty_score": 1-10 integer (production difficulty),
  "viral_score": 1-100 integer (shareability prediction),
  "body": "full concept: script beats, carousel slide outline, post copy, blog angle, push text, or email subject + preview — depending on format"
}

PlantPal mentions should feel earned — woven into the story, not bolted on.
Return ONLY valid JSON: { "ideas": [ ... ] }`;
}

export function buildUserPrompt(opts: {
  count: number;
  contentType?: string;
  format?: string;
  theme?: string;
}): string {
  const parts = [`Generate exactly ${opts.count} unique creative content ideas for PlantPal.`];

  if (opts.contentType && opts.contentType !== "all") {
    parts.push(`Focus on content_type: ${opts.contentType}.`);
  } else {
    parts.push("Mix across all 7 content types — variety is critical.");
  }

  if (opts.format && opts.format !== "all") {
    parts.push(`Every idea must use format: ${opts.format}.`);
  } else {
    parts.push("Mix across different output formats.");
  }

  if (opts.theme?.trim()) {
    parts.push(`Optional theme/context from the team: ${opts.theme.trim()}`);
  }

  parts.push(
    "Make each idea distinctly different. No repeated hooks. Push for surprise and specificity.",
    "Vary difficulty_score and viral_score realistically — not everything should score 90+."
  );

  return parts.join(" ");
}
