import OpenAI from "openai";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import { logIntegrationCall, updateProviderStatus } from "@/lib/integrations/log";

export const OPENAI_KEY_ERROR_MESSAGE =
  "OpenAI API key is invalid or missing. Update OPENAI_API_KEY in Vercel.";

export function isOpenAIKeyError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("401") ||
    m.includes("incorrect api key") ||
    m.includes("invalid api key") ||
    m.includes("openai is not configured")
  );
}

export function getOpenAIClient() {
  if (!isOpenAIConfigured()) {
    throw new Error(OPENAI_KEY_ERROR_MESSAGE);
  }
  const { apiKey } = getOpenAIConfig();
  return new OpenAI({ apiKey });
}

export async function callOpenAIJson<T>(
  system: string,
  user: string,
  temperature = 0.9
): Promise<T> {
  if (!isOpenAIConfigured()) {
    await logIntegrationCall({
      provider: "openai",
      action: "chat_json",
      status: "error",
      requestSummary: user.slice(0, 120),
      errorMessage: OPENAI_KEY_ERROR_MESSAGE,
    });
    throw new Error(OPENAI_KEY_ERROR_MESSAGE);
  }

  const { model } = getOpenAIConfig();
  const client = getOpenAIClient();
  const start = Date.now();

  try {
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
  } catch (e) {
    const raw = e instanceof Error ? e.message : "OpenAI call failed";
    const friendly = isOpenAIKeyError(raw) ? OPENAI_KEY_ERROR_MESSAGE : raw;
    // Save the failed attempt so /integrations and the API usage report see it
    await logIntegrationCall({
      provider: "openai",
      action: "chat_json",
      status: "error",
      requestSummary: user.slice(0, 120),
      errorMessage: friendly === raw ? raw : `${friendly} (${raw.slice(0, 160)})`,
      durationMs: Date.now() - start,
    });
    await updateProviderStatus("openai", "error", { errorMessage: friendly });
    throw new Error(friendly);
  }
}
