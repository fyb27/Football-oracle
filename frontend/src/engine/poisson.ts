import type { Outcome, ScoreLine } from "../types";

/** Poisson probability mass: P(k events | rate λ). */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
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
  matrix: number[][];
  outcome: Outcome;
  scoreLines: ScoreLine[];
}

/** Bivariate (independent) Poisson scoreline model over a truncated grid. */
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
