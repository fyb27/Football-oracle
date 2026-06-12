import type { HeadToHead } from "../data/types.js";
import type { RiskLevel } from "./types.js";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface RiskInput {
  signal: number; // -1..1 strength edge
  modelAgreement: number; // 0..1
  formConsistency: number; // 0..1 averaged
  h2h: HeadToHead;
}

/**
 * Risk measures *un*predictability. It is the inverse blend of four
 * predictability signals from the spec:
 *  - team strength difference (a clear favourite is predictable)
 *  - model agreement (independent models concurring is predictable)
 *  - historical predictability (decisive H2H records are predictable)
 *  - recent form consistency (steady form is predictable)
 *
 * Returned factor values are predictability scores (0..100, higher = better);
 * `score` is the resulting risk (0..100, higher = riskier).
 */
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
  const strengthGap = Math.abs(input.signal); // 0..1
  const agreement = clamp(input.modelAgreement, 0, 1);

  // Decisiveness of the H2H record: how dominant the most common result is.
  let predictability = 0.5;
  if (input.h2h.meetings > 0) {
    const top = Math.max(input.h2h.homeWins, input.h2h.draws, input.h2h.awayWins);
    predictability = top / input.h2h.meetings;
    // Few meetings carry less signal — pull toward neutral.
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
