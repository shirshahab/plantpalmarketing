import { invokeIntegration } from "@/lib/integrations/invoke";
import { isOpenAIIntegrationConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";
import { getOpenAIConfig } from "@/lib/openai/config";

export async function healthCheckOpenAI(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isOpenAIIntegrationConfigured()) {
    return {
      provider: "openai",
      status: "disconnected",
      configured: false,
      message: "OPENAI_API_KEY not configured",
      durationMs: Date.now() - start,
    };
  }

  try {
    const { apiKey } = getOpenAIConfig();
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        provider: "openai",
        status: "error",
        configured: true,
        message: `OpenAI API error: ${res.status} ${body.slice(0, 120)}`,
        durationMs: Date.now() - start,
      };
    }
    const data = (await res.json()) as { data?: unknown[] };
    return {
      provider: "openai",
      status: "connected",
      configured: true,
      message: `Connected — ${data.data?.length ?? 0} models available`,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    return {
      provider: "openai",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "OpenAI health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function generateIntegrationSummary(prompt: string, agentId?: string): Promise<string> {
  const { apiKey, model } = getOpenAIConfig();
  return invokeIntegration({
    provider: "openai",
    action: "generate_summary",
    agentId,
    requestSummary: prompt.slice(0, 120),
    fn: async () => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a concise marketing analyst for PlantPal." },
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return json.choices?.[0]?.message?.content?.trim() ?? "";
    },
    summarize: (r) => r.slice(0, 80),
  });
}
