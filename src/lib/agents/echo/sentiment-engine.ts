export type EchoSentimentLabel = "positive" | "neutral" | "negative" | "urgent";

export function computeFeaturePriority(frequency: number, impact: number, demand: number): number {
  const freqScore = Math.min(100, frequency * 2);
  const score = freqScore * 0.4 + impact * 0.35 + Math.min(100, demand / 10) * 0.25;
  return Math.round(Math.min(100, Math.max(1, score)));
}

export function computeSentimentTrend(
  currentPositivePct: number,
  previousPositivePct: number
): "improving" | "stable" | "declining" {
  const delta = currentPositivePct - previousPositivePct;
  if (delta > 3) return "improving";
  if (delta < -3) return "declining";
  return "stable";
}

export function classifyUrgency(content: string, sentiment: EchoSentimentLabel): EchoSentimentLabel {
  const urgentKeywords = ["crash", "broken", "can't login", "lost all", "refund", "cancel", "delete account", "not working"];
  const lower = content.toLowerCase();
  if (urgentKeywords.some((k) => lower.includes(k))) return "urgent";
  return sentiment;
}
