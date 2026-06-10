export interface AtlasOpportunityInputs {
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  revenuePotential: number;
  retentionPotential: number;
}

/** Lower cost is better — invert for scoring */
export function computeOpportunityScore(inputs: AtlasOpportunityInputs): number {
  const costScore = 100 - inputs.cost;
  const score =
    inputs.reach * 0.2 +
    costScore * 0.15 +
    (100 - inputs.difficulty) * 0.15 +
    inputs.virality * 0.2 +
    inputs.revenuePotential * 0.15 +
    inputs.retentionPotential * 0.15;
  return Math.round(Math.min(100, Math.max(1, score)));
}

export function clampMetric(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function inferGrowthStage(totalUsers: number): "0_to_1k" | "1k_to_10k" | "10k_to_100k" | "100k_to_1m" {
  if (totalUsers < 1000) return "0_to_1k";
  if (totalUsers < 10000) return "1k_to_10k";
  if (totalUsers < 100000) return "10k_to_100k";
  return "100k_to_1m";
}

export function forecastUsers(
  currentUsers: number,
  weeklyGrowthRate: number,
  days: number
): number {
  const dailyRate = Math.pow(1 + weeklyGrowthRate / 100, 1 / 7) - 1;
  return Math.round(currentUsers * Math.pow(1 + dailyRate, days));
}
