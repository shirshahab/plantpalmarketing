import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";

export interface ImageGenerationResult {
  ok: boolean;
  url?: string;
  provider: string;
  model: string;
  error?: string;
}

/**
 * Image generation is currently backed by the OpenAI Images API when
 * OPENAI_API_KEY is set. Without a key the pipeline still works — assets are
 * created as placeholder packages the founder can review and attach.
 */
export function isImageGenerationConfigured(): boolean {
  return isOpenAIConfigured();
}

export async function generateImageWithProvider(prompt: string): Promise<ImageGenerationResult> {
  if (!isImageGenerationConfigured()) {
    return {
      ok: false,
      provider: "none",
      model: "",
      error: "Image generation provider not connected yet.",
    };
  }

  const { apiKey } = getOpenAIConfig();
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "dall-e-3";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: prompt.slice(0, 3900),
        n: 1,
        size: "1024x1024",
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        provider: "openai",
        model,
        error: `OpenAI images API ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const url = json.data?.[0]?.url ?? "";
    if (!url) {
      return { ok: false, provider: "openai", model, error: "No image URL returned" };
    }
    return { ok: true, url, provider: "openai", model };
  } catch (e) {
    return {
      ok: false,
      provider: "openai",
      model,
      error: e instanceof Error ? e.message : "Image generation failed",
    };
  }
}
