import type { Outcome, ScoreLine } from "./types.js";

/** Poisson probability mass: P(k events | rate λ). */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // exp(k*ln(λ) - λ - ln(k!)) — log-space for numerical stability.
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k));
}

const logFactorialCache = [0, 0];
function logFactorial(n: number): number {
  if (n < logFactorialCache.length) return logFactorialCache[n];
  let result = logFactorialCache[logFactorialCache.length - 1];
  for (let i = logFactorialCache.length; i <= n; i++) {
    result += Math.log(i);
    logFactorialCache[i] = result;
  }
  return logFactorialCache[n];
}

export interface PoissonResult {
  /** matrix[h][a] = probability of home scoring h, away scoring a (0..1). */
  matrix: number[][];
  /** Outcome probabilities derived from the matrix, as percentages. */
  outcome: Outcome;
  /** Score lines sorted most-likely first, probability as a percentage. */
  scoreLines: ScoreLine[];
}

/**
 * Bivariate (independent) Poisson scoreline model.
 *
 * Independence is the standard simplifying assumption; it is accurate enough
 * for outcome + likely-scoreline purposes. `maxGoals` bounds the grid (the
 * spec asks for 0-0..5-5, we compute one extra row/col to capture the tail and
 * renormalise so probabilities sum to 1).
 */
export function poissonModel(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 6,
): PoissonResult {
  const size = maxGoals + 1;
  const homePmf = Array.from({ length: size }, (_, k) => poissonPmf(k, lambdaHome));
  const awayPmf = Array.from({ length: size }, (_, k) => poissonPmf(k, lambdaAway));

  const matrix: number[][] = [];
  let total = 0;
  for (let h = 0; h < size; h++) {
    matrix[h] = [];
    for (let a = 0; a < size; a++) {
      const p = homePmf[h] * awayPmf[a];
      matrix[h][a] = p;
      total += p;
    }
  }

  // Renormalise so the truncated grid sums to exactly 1.
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  const scoreLines: ScoreLine[] = [];
  for (let h = 0; h < size; h++) {
    for (let a = 0; a < size; a++) {
      const p = matrix[h][a] / total;
      matrix[h][a] = p;
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      scoreLines.push({ home: h, away: a, probability: p * 100, label: `${h}-${a}` });
    }
  }

  scoreLines.sort((x, y) => y.probability - x.probability);

  return {
    matrix,
    outcome: { homeWin: homeWin * 100, draw: draw * 100, awayWin: awayWin * 100 },
    scoreLines,
  };
}
