import type { Outcome, ConfidenceLabel } from "./types.js";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface ConfidenceInput {
  outcome: Outcome; // blended, percentages
  signal: number; // -1..1 strength edge
  modelAgreement: number; // 0..1, weighted vs Poisson agreement
  formConsistency: number; // 0..1, averaged across both teams
}

/**
 * Confidence answers "how sure are we about the single most likely outcome".
 * It rewards a clear favourite (big gap between top two outcomes), a decisive
 * strength edge, agreement between the two independent models, and stable form.
 */
export function computeConfidence(input: ConfidenceInput): {
  score: number;
  stars: number;
  label: ConfidenceLabel;
} {
  const probs = [input.outcome.homeWin, input.outcome.draw, input.outcome.awayWin].sort(
    (a, b) => b - a,
  );
  const margin = probs[0] - probs[1]; // 0..100
  const marginNorm = clamp(margin / 50, 0, 1);
  const strength = Math.abs(input.signal);

  const score =
    100 *
    (0.4 * marginNorm +
      0.25 * strength +
      0.2 * clamp(input.modelAgreement, 0, 1) +
      0.15 * clamp(input.formConsistency, 0, 1));

  const rounded = Math.round(clamp(score, 0, 100));
  const stars = clamp(Math.round(rounded / 20), 1, 5);

  let label: ConfidenceLabel = "Low Confidence";
  if (rounded >= 85) label = "Very High Confidence";
  else if (rounded >= 70) label = "High Confidence";
  else if (rounded >= 50) label = "Medium Confidence";

  return { score: rounded, stars, label };
}
