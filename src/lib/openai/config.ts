export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!key || key.includes("your_openai") || key.length < 20) return false;
  return true;
}

export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
  };
}
