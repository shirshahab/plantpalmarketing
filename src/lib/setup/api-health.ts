import { healthCheckOpenAI } from "@/lib/integrations/providers/openai-provider";
import { healthCheckOpenWeather } from "@/lib/integrations/providers/openweather-provider";
import { healthCheckPlantNet } from "@/lib/integrations/providers/plantnet-provider";
import { healthCheckPerenual } from "@/lib/integrations/providers/perenual-provider";
import { healthCheckSerpApi } from "@/lib/integrations/providers/serpapi-provider";
import { healthCheckX } from "@/lib/integrations/x-service";
import { getProviderStatusesFromDb } from "@/lib/db/integration-queries";
import { getImageModel, isImageGenerationConfigured } from "@/lib/integrations/providers/image-generation-provider";
import { getVideoProviderStatus } from "@/lib/video/video-provider";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";

export interface ApiHealthRow {
  id: string;
  label: string;
  envVars: string[];
  envPresent: boolean;
  status: "ok" | "error" | "not_configured";
  message: string;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string;
  fix: string;
}

function envPresent(...names: string[]): boolean {
  return names.every((name) => {
    const v = process.env[name]?.trim() ?? "";
    return v.length > 0 && !v.toLowerCase().includes("your_");
  });
}

/** Cheap live check that a specific OpenAI model is available to this key. */
async function checkOpenAIModel(model: string): Promise<{ ok: boolean; message: string }> {
  const { apiKey } = getOpenAIConfig();
  try {
    const res = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (res.ok) return { ok: true, message: `Model ${model} is available` };
    if (res.status === 404) return { ok: false, message: `Model ${model} not available on this key` };
    if (res.status === 401) return { ok: false, message: "Invalid OPENAI_API_KEY (401)" };
    return { ok: false, message: `OpenAI API ${res.status}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Request failed" };
  }
}

export async function checkAllApiHealth(): Promise<ApiHealthRow[]> {
  // Last success/error history from integration_status (empty if table missing)
  const dbStatuses = await getProviderStatusesFromDb().catch(() => []);
  const history = new Map(dbStatuses.map((s) => [s.provider as string, s]));

  function withHistory(provider: string) {
    const row = history.get(provider);
    const lastError = row?.lastErrorMessage ?? "";
    return {
      lastSuccessAt: row?.lastSuccessAt ?? null,
      lastErrorAt: row?.lastErrorAt ?? null,
      lastError: /migration/i.test(lastError) ? "" : lastError,
    };
  }

  const imageModel = getImageModel();
  const videoStatus = getVideoProviderStatus();

  const [openaiText, openaiImage, openaiVideo, openweather, plantnet, perenual, serpapi, x] =
    await Promise.all([
      healthCheckOpenAI(),
      isImageGenerationConfigured()
        ? checkOpenAIModel(imageModel)
        : Promise.resolve({ ok: false, message: "OPENAI_API_KEY not configured" }),
      videoStatus.provider === "openai" && isOpenAIConfigured()
        ? checkOpenAIModel(videoStatus.model)
        : Promise.resolve({ ok: false, message: videoStatus.message }),
      healthCheckOpenWeather(),
      healthCheckPlantNet(),
      healthCheckPerenual(),
      healthCheckSerpApi(),
      healthCheckX(),
    ]);

  function providerRow(
    id: string,
    label: string,
    envVars: string[],
    result: { status: string; message: string },
    fix: string
  ): ApiHealthRow {
    const present = envPresent(envVars[0]);
    return {
      id,
      label,
      envVars,
      envPresent: present,
      status: !present ? "not_configured" : result.status === "connected" ? "ok" : "error",
      message: result.message,
      ...withHistory(id === "x" ? "x" : id),
      fix: !present ? fix : result.status === "connected" ? "" : fix,
    };
  }

  return [
    providerRow("openai", "OpenAI (text)", ["OPENAI_API_KEY"], openaiText, "Set OPENAI_API_KEY in Vercel env, then redeploy."),
    {
      id: "openai_image",
      label: "OpenAI (image)",
      envVars: ["OPENAI_API_KEY", "OPENAI_IMAGE_MODEL"],
      envPresent: envPresent("OPENAI_API_KEY"),
      status: !isImageGenerationConfigured() ? "not_configured" : openaiImage.ok ? "ok" : "error",
      message: openaiImage.ok ? openaiImage.message : openaiImage.message,
      ...withHistory("openai"),
      fix: openaiImage.ok
        ? ""
        : `Set OPENAI_IMAGE_MODEL=gpt-image-1 (current model: ${imageModel}) and verify the key has image access.`,
    },
    {
      id: "openai_video",
      label: "OpenAI (video)",
      envVars: ["VIDEO_PROVIDER", "OPENAI_VIDEO_MODEL"],
      envPresent: videoStatus.provider === "openai" && envPresent("OPENAI_API_KEY"),
      status:
        videoStatus.provider !== "openai"
          ? "not_configured"
          : openaiVideo.ok
            ? "ok"
            : "error",
      message:
        videoStatus.provider !== "openai"
          ? `VIDEO_PROVIDER=${videoStatus.provider} — manual packages only`
          : openaiVideo.message,
      ...withHistory("openai"),
      fix:
        videoStatus.provider !== "openai"
          ? "Optional: set VIDEO_PROVIDER=openai and OPENAI_VIDEO_MODEL=sora-2 to enable real generation."
          : openaiVideo.ok
            ? ""
            : `Verify OPENAI_VIDEO_MODEL (current: ${videoStatus.model}) is enabled for this key.`,
    },
    providerRow("openweather", "OpenWeather", ["OPENWEATHER_API_KEY"], openweather, "Set OPENWEATHER_API_KEY (free tier works)."),
    providerRow("plantnet", "PlantNet", ["PLANTNET_API_KEY"], plantnet, "Set PLANTNET_API_KEY from my.plantnet.org."),
    providerRow("perenual", "Perenual", ["PERENUAL_API_KEY"], perenual, "Set PERENUAL_API_KEY from perenual.com/docs/api."),
    providerRow("serpapi", "SerpAPI", ["SERPAPI_KEY"], serpapi, "Set SERPAPI_KEY from serpapi.com."),
    providerRow("x", "X (Twitter)", ["X_BEARER_TOKEN"], x, "Set X_BEARER_TOKEN for reads; OAuth tokens for publishing."),
  ];
}
