export interface IvyScoreInputs {
  revenueImpact: number;
  growthImpact: number;
  viralityPotential: number;
  timeSensitivity: number;
}

export function computePriorityScore(inputs: IvyScoreInputs): number {
  const score =
    inputs.revenueImpact * 0.35 +
    inputs.growthImpact * 0.3 +
    inputs.viralityPotential * 0.2 +
    inputs.timeSensitivity * 0.15;
  return Math.round(Math.min(100, Math.max(1, score)));
}

export function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
