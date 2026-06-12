import type { HeadToHead, RiskLevel } from "../types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface RiskInput {
  signal: number;
  modelAgreement: number;
  formConsistency: number;
  h2h: HeadToHead;
}

export function computeRisk(input: RiskInput): {
  level: RiskLevel;
  score: number;
  factors: {
    strengthGap: number;
    modelAgreement: number;
    historicalPredictability: number;
    formConsistency: number;
  };
} {
  const strengthGap = Math.abs(input.signal);
  const agreement = clamp(input.modelAgreement, 0, 1);

  let predictability = 0.5;
  if (input.h2h.meetings > 0) {
    const top = Math.max(input.h2h.homeWins, input.h2h.draws, input.h2h.awayWins);
    predictability = top / input.h2h.meetings;
    if (input.h2h.meetings < 3) predictability = 0.5 + (predictability - 0.5) * 0.5;
  }

  const consistency = clamp(input.formConsistency, 0, 1);

  const risk =
    100 *
    (0.35 * (1 - strengthGap) +
      0.3 * (1 - agreement) +
      0.15 * (1 - predictability) +
      0.2 * (1 - consistency));

  const score = Math.round(clamp(risk, 0, 100));

  let level: RiskLevel = "Low";
  if (score >= 62) level = "High";
  else if (score >= 38) level = "Medium";

  return {
    level,
    score,
    factors: {
      strengthGap: Math.round(strengthGap * 100),
      modelAgreement: Math.round(agreement * 100),
      historicalPredictability: Math.round(predictability * 100),
      formConsistency: Math.round(consistency * 100),
    },
  };
}
