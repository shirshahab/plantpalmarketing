export interface FernAcquisitionInputs {
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  estimatedInstalls: number;
}

export function computeAcquisitionScore(inputs: FernAcquisitionInputs): number {
  const costScore = 100 - inputs.cost;
  const installScore = Math.min(100, inputs.estimatedInstalls / 20);
  const score =
    inputs.reach * 0.25 +
    costScore * 0.15 +
    (100 - inputs.difficulty) * 0.15 +
    inputs.virality * 0.25 +
    installScore * 0.2;
  return Math.round(Math.min(100, Math.max(1, score)));
}

export function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function estimateMonthlyInstalls(
  baseInstalls: number,
  channelShare: number,
  upliftPct: number
): number {
  return Math.round(baseInstalls * (channelShare / 100) * (1 + upliftPct / 100));
}
