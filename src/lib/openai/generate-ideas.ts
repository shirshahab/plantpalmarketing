import OpenAI from "openai";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import {
  buildCreativeSystemPrompt,
  buildUserPrompt,
} from "@/lib/openai/creative-system-prompt";
import type { CreativeContentType, CreativeOutputFormat } from "@/lib/creative/framework";

export interface GeneratedCreativeIdea {
  title: string;
  content_type: CreativeContentType;
  format: CreativeOutputFormat;
  hook: string;
  emotional_trigger: string;
  why_it_works: string;
  cta: string;
  difficulty_score: number;
  viral_score: number;
  body: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseIdeas(raw: string): GeneratedCreativeIdea[] {
  const parsed = JSON.parse(raw) as { ideas?: unknown };
  if (!Array.isArray(parsed.ideas)) {
    throw new Error("OpenAI response missing ideas array");
  }

  return parsed.ideas.map((item, i) => {
    const row = item as Record<string, unknown>;
    if (!row.title || !row.hook) {
      throw new Error(`Idea ${i + 1} missing required fields`);
    }
    return {
      title: String(row.title),
      content_type: String(row.content_type) as CreativeContentType,
      format: String(row.format) as CreativeOutputFormat,
      hook: String(row.hook),
      emotional_trigger: String(row.emotional_trigger ?? ""),
      why_it_works: String(row.why_it_works ?? ""),
      cta: String(row.cta ?? ""),
      difficulty_score: clamp(Number(row.difficulty_score) || 5, 1, 10),
      viral_score: clamp(Number(row.viral_score) || 50, 1, 100),
      body: String(row.body ?? ""),
    };
  });
}

export async function generateCreativeIdeasWithOpenAI(opts: {
  count: number;
  contentType?: string;
  format?: string;
  theme?: string;
}): Promise<GeneratedCreativeIdea[]> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to .env.local");
  }

  const { apiKey, model } = getOpenAIConfig();
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model,
    temperature: 0.95,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildCreativeSystemPrompt() },
      { role: "user", content: buildUserPrompt(opts) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const ideas = parseIdeas(content);
  if (ideas.length === 0) throw new Error("No ideas generated");

  return ideas.slice(0, opts.count);
}
