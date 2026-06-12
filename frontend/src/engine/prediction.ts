import type { RecentMatch, HeadToHead, Outcome, FactorContribution } from "../types";
import type { Team } from "./dataTypes";
import { expectedScore } from "./elo";

const LEAGUE_AVG_GOALS = 1.35;

/** Factor weights — must sum to 1. */
export const WEIGHTS = {
  elo: 0.3,
  form: 0.25,
  xg: 0.15,
  goalsScored: 0.1,
  goalsConceded: 0.1,
  h2h: 0.05,
  homeAdvantage: 0.05,
} as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function formScore(form: RecentMatch[]): number {
  if (form.length === 0) return 0.5;
  const pts = form.reduce<number>(
    (sum, m) => sum + (m.result === "W" ? 3 : m.result === "D" ? 1 : 0),
    0,
  );
  return pts / (form.length * 3);
}

export function formConsistency(form: RecentMatch[]): number {
  if (form.length < 2) return 0.5;
  const pts: number[] = form.map((m) => (m.result === "W" ? 3 : m.result === "D" ? 1 : 0));
  const mean = pts.reduce((a, b) => a + b, 0) / pts.length;
  const variance = pts.reduce((a, p) => a + (p - mean) ** 2, 0) / pts.length;
  return 1 - clamp(Math.sqrt(variance) / 1.5, 0, 1);
}

export interface WeightedPrediction {
  outcome: Outcome;
  factors: FactorContribution[];
  signal: number;
  lambdaHome: number;
  lambdaAway: number;
}

export function predict(
  home: Team,
  away: Team,
  homeForm: RecentMatch[],
  awayForm: RecentMatch[],
  h2h: HeadToHead,
  opts: { neutral?: boolean } = {},
): WeightedPrediction {
  // On a neutral venue (e.g. a World Cup match) the home edge is removed.
  const homeBoost = opts.neutral ? 1.0 : 1.1;
  const awayBoost = opts.neutral ? 1.0 : 0.95;
  const eloExp = expectedScore(home.elo, away.elo);
  const eloSignal = 2 * eloExp - 1;

  const formSignal = clamp(formScore(homeForm) - formScore(awayForm), -1, 1);

  const netXgHome = home.stats.xgFor - home.stats.xgAgainst;
  const netXgAway = away.stats.xgFor - away.stats.xgAgainst;
  const xgSignal = clamp((netXgHome - netXgAway) / 2, -1, 1);

  const gsSignal = clamp(
    (home.stats.avgGoalsScored - away.stats.avgGoalsScored) / 2,
    -1,
    1,
  );

  const gcSignal = clamp(
    (away.stats.avgGoalsConceded - home.stats.avgGoalsConceded) / 2,
    -1,
    1,
  );

  const h2hSignal =
    h2h.meetings > 0 ? clamp((h2h.homeWins - h2h.awayWins) / h2h.meetings, -1, 1) : 0;

  const homeAdvSignal = opts.neutral ? 0 : 0.4;

  const factors: FactorContribution[] = [
    fc("elo", "Elo Rating", WEIGHTS.elo, eloSignal),
    fc("form", "Recent Form", WEIGHTS.form, formSignal),
    fc("xg", "Expected Goals (xG)", WEIGHTS.xg, xgSignal),
    fc("goalsScored", "Goals Scored", WEIGHTS.goalsScored, gsSignal),
    fc("goalsConceded", "Goals Conceded", WEIGHTS.goalsConceded, gcSignal),
    fc("h2h", "Head-to-Head", WEIGHTS.h2h, h2hSignal),
    fc("homeAdvantage", "Home Advantage", WEIGHTS.homeAdvantage, homeAdvSignal),
  ];

  const signal = clamp(
    factors.reduce((sum, f) => sum + f.contribution, 0),
    -1,
    1,
  );

  const drawProb = clamp(0.3 - 0.18 * Math.abs(signal), 0.12, 0.3);
  const remaining = 1 - drawProb;
  const homeShare = clamp(0.5 + 0.5 * signal, 0.02, 0.98);
  const outcome: Outcome = {
    homeWin: remaining * homeShare * 100,
    draw: drawProb * 100,
    awayWin: remaining * (1 - homeShare) * 100,
  };

  const homeAttack = (home.stats.avgGoalsScored + home.stats.xgFor) / 2 / LEAGUE_AVG_GOALS;
  const awayAttack = (away.stats.avgGoalsScored + away.stats.xgFor) / 2 / LEAGUE_AVG_GOALS;
  const homeDef = (home.stats.avgGoalsConceded + home.stats.xgAgainst) / 2 / LEAGUE_AVG_GOALS;
  const awayDef = (away.stats.avgGoalsConceded + away.stats.xgAgainst) / 2 / LEAGUE_AVG_GOALS;

  let lambdaHome = LEAGUE_AVG_GOALS * homeAttack * awayDef * homeBoost;
  let lambdaAway = LEAGUE_AVG_GOALS * awayAttack * homeDef * awayBoost;

  lambdaHome *= 1 + 0.15 * signal;
  lambdaAway *= 1 - 0.15 * signal;

  return {
    outcome,
    factors,
    signal,
    lambdaHome: clamp(lambdaHome, 0.2, 4.5),
    lambdaAway: clamp(lambdaAway, 0.2, 4.5),
  };
}

function fc(
  key: string,
  label: string,
  weight: number,
  signal: number,
): FactorContribution {
  return { key, label, weight, signal, contribution: weight * signal };
}
