import type { IntegrationProvider, ProviderConfigInfo } from "@/lib/integrations/types";

function isValidKey(key: string, placeholder: string[], minLen = 8): boolean {
  if (!key || key.length < minLen) return false;
  return !placeholder.some((p) => key.toLowerCase().includes(p));
}

export function isOpenAIIntegrationConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  return isValidKey(key, ["your_openai"], 20);
}

export function isOpenWeatherConfigured(): boolean {
  const key = process.env.OPENWEATHER_API_KEY?.trim() ?? "";
  return isValidKey(key, ["your_openweather", "your_"], 10);
}

export function getWeatherProvider(): string {
  return process.env.WEATHER_PROVIDER?.trim() || "openweather";
}

export function isPlantNetConfigured(): boolean {
  const key = process.env.PLANTNET_API_KEY?.trim() ?? "";
  return isValidKey(key, ["your_plantnet", "your_"], 8);
}

export function isPerenualConfigured(): boolean {
  const key = process.env.PERENUAL_API_KEY?.trim() ?? "";
  return isValidKey(key, ["your_perenual", "your_"], 8);
}

export function isSerpApiConfigured(): boolean {
  const key = process.env.SERPAPI_KEY?.trim() ?? "";
  return isValidKey(key, ["your_serpapi", "your_"], 16);
}

export function isXReadConfigured(): boolean {
  const bearer = process.env.X_BEARER_TOKEN?.trim() ?? "";
  return isValidKey(bearer, ["your_x_bearer", "your_"], 20);
}

export function isXAccessTokenConfigured(): boolean {
  const access = process.env.X_ACCESS_TOKEN?.trim() ?? "";
  return isValidKey(access, ["your_x_access", "your_"], 8);
}

export function isXAccessTokenSecretConfigured(): boolean {
  const accessSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim() ?? "";
  return isValidKey(accessSecret, ["your_x_access", "your_"], 8);
}

export function isXPublishConfigured(): boolean {
  const key = process.env.X_API_KEY?.trim() ?? "";
  const secret = process.env.X_API_SECRET?.trim() ?? "";
  return (
    isValidKey(key, ["your_x_api"], 8) &&
    isValidKey(secret, ["your_x_api"], 8) &&
    isXAccessTokenConfigured() &&
    isXAccessTokenSecretConfigured()
  );
}

export interface XPublishCredentialStatus {
  readConnected: boolean;
  publishConnected: boolean;
  missingReadVars: string[];
  missingPublishVars: string[];
}

export function getXPublishCredentialStatus(): XPublishCredentialStatus {
  const missingReadVars: string[] = [];
  const missingPublishVars: string[] = [];

  if (!isXReadConfigured()) missingReadVars.push("X_BEARER_TOKEN");

  if (!isValidKey(process.env.X_API_KEY?.trim() ?? "", ["your_x_api"], 8)) {
    missingPublishVars.push("X_API_KEY");
  }
  if (!isValidKey(process.env.X_API_SECRET?.trim() ?? "", ["your_x_api"], 8)) {
    missingPublishVars.push("X_API_SECRET");
  }
  if (!isXAccessTokenConfigured()) missingPublishVars.push("X_ACCESS_TOKEN");
  if (!isXAccessTokenSecretConfigured()) missingPublishVars.push("X_ACCESS_TOKEN_SECRET");

  return {
    readConnected: isXReadConfigured(),
    publishConnected: isXPublishConfigured(),
    missingReadVars,
    missingPublishVars,
  };
}

export function isXConfigured(): boolean {
  return isXReadConfigured() || isXPublishConfigured();
}

export function isProviderConfigured(provider: IntegrationProvider): boolean {
  switch (provider) {
    case "openai": return isOpenAIIntegrationConfigured();
    case "openweather": return isOpenWeatherConfigured();
    case "plantnet": return isPlantNetConfigured();
    case "perenual": return isPerenualConfigured();
    case "serpapi": return isSerpApiConfigured();
    case "x": return isXConfigured();
  }
}

export function getOpenWeatherConfig() {
  return { apiKey: process.env.OPENWEATHER_API_KEY?.trim() ?? "", provider: getWeatherProvider() };
}

export function getPlantNetConfig() {
  return { apiKey: process.env.PLANTNET_API_KEY?.trim() ?? "" };
}

export function getPerenualConfig() {
  return { apiKey: process.env.PERENUAL_API_KEY?.trim() ?? "" };
}

export function getSerpApiConfig() {
  return { apiKey: process.env.SERPAPI_KEY?.trim() ?? "" };
}

export function getXConfig() {
  return {
    bearerToken: process.env.X_BEARER_TOKEN?.trim() ?? "",
    apiKey: process.env.X_API_KEY?.trim() ?? "",
    apiSecret: process.env.X_API_SECRET?.trim() ?? "",
    accessToken: process.env.X_ACCESS_TOKEN?.trim() ?? "",
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET?.trim() ?? "",
  };
}

export const PROVIDER_CATALOG: ProviderConfigInfo[] = [
  {
    provider: "openai",
    label: "OpenAI",
    description: "Agent reasoning, content generation, creative scoring, executive summaries",
    envVars: ["OPENAI_API_KEY", "OPENAI_MODEL"],
    uses: ["Agent Brain", "Bloom", "Sage", "Ivy", "Atlas", "Echo reports"],
    configured: false,
  },
  {
    provider: "openweather",
    label: "OpenWeather",
    description: "Weather-driven gardening content and local alerts",
    envVars: ["OPENWEATHER_API_KEY", "WEATHER_PROVIDER"],
    uses: ["Bloom seasonal content", "Roots local alerts", "Fern opportunities"],
    configured: false,
  },
  {
    provider: "plantnet",
    label: "PlantNet",
    description: "Plant identification enrichment and health context",
    envVars: ["PLANTNET_API_KEY"],
    uses: ["Bloom plant content", "Echo plant feedback context"],
    configured: false,
  },
  {
    provider: "perenual",
    label: "Perenual",
    description: "Plant care database — watering, sunlight, care guides",
    envVars: ["PERENUAL_API_KEY"],
    uses: ["Bloom care content", "Academy enrichment"],
    configured: false,
  },
  {
    provider: "serpapi",
    label: "SerpAPI",
    description: "Trend discovery, creator search, competitor intel, search demand",
    envVars: ["SERPAPI_KEY"],
    uses: ["Scout creator discovery", "Sentinel competitor monitoring", "Fern acquisition"],
    configured: false,
  },
  {
    provider: "x",
    label: "X (Twitter)",
    description: "Metrics, engagement, drafts, queue — publish only after Gate approval",
    envVars: ["X_BEARER_TOKEN", "X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"],
    uses: ["Roots monitoring", "Scout discovery", "Sentinel intel", "Bloom → Sage → Gate → Sprout → X"],
    configured: false,
  },
];

export function getProviderCatalog(): ProviderConfigInfo[] {
  return PROVIDER_CATALOG.map((p) => ({
    ...p,
    configured: isProviderConfigured(p.provider),
  }));
}
