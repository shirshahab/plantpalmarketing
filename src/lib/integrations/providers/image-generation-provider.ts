import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import { uploadToBucket, ASSET_BUCKET } from "@/lib/storage/media-storage";

export interface ImageGenerationResult {
  ok: boolean;
  url?: string;
  provider: string;
  model: string;
  error?: string;
}

export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

/**
 * Image generation is backed by the OpenAI Images API when OPENAI_API_KEY is
 * set. Without a key the pipeline still works — assets are created as
 * placeholder packages the founder can review and attach.
 */
export function isImageGenerationConfigured(): boolean {
  return isOpenAIConfigured();
}

/**
 * gpt-image-1 returns base64 instead of a hosted URL. Upload it to the
 * public `generated-assets` storage bucket; fall back to a data URL if the
 * bucket isn't available so the preview still works.
 */
async function storeBase64Image(b64: string, format: string): Promise<string> {
  // Phase 38 — service-role upload (bypasses storage RLS); data URL fallback
  // keeps the preview alive if storage is completely unavailable.
  const bytes = Buffer.from(b64, "base64");
  const path = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${format}`;
  const stored = await uploadToBucket(ASSET_BUCKET, path, bytes, `image/${format}`);
  if (stored.ok && stored.url) return stored.url;
  return `data:image/${format};base64,${b64}`;
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
  const model = getImageModel();
  const isGptImage = model.startsWith("gpt-image");

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
        // gpt-image models always return base64; jpeg keeps payloads small.
        ...(isGptImage ? { output_format: "jpeg", quality: "medium" } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        provider: "openai",
        model,
        error: `OpenAI Images API ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const json = (await res.json()) as {
      data?: { url?: string; b64_json?: string }[];
      output_format?: string;
    };
    const first = json.data?.[0];

    if (first?.url) {
      return { ok: true, url: first.url, provider: "openai", model };
    }
    if (first?.b64_json) {
      const format = json.output_format || (isGptImage ? "jpeg" : "png");
      const url = await storeBase64Image(first.b64_json, format);
      return { ok: true, url, provider: "openai", model };
    }
    return { ok: false, provider: "openai", model, error: "No image data returned" };
  } catch (e) {
    return {
      ok: false,
      provider: "openai",
      model,
      error: e instanceof Error ? e.message : "Image generation failed",
    };
  }
}
