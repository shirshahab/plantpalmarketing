import OpenAI from "openai";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";

export function getOpenAIClient() {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to .env.local");
  }
  const { apiKey } = getOpenAIConfig();
  return new OpenAI({ apiKey });
}

export async function callOpenAIJson<T>(
  system: string,
  user: string,
  temperature = 0.9
): Promise<T> {
  const { model } = getOpenAIConfig();
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return JSON.parse(content) as T;
}
