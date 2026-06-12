import type { MatchDataProvider, Team, RecentMatch } from "../data/types.js";
import type { MatchAnalysis, Outcome, TeamSummary } from "./types.js";
import { predict, formConsistency } from "./prediction.js";
import { poissonModel } from "./poisson.js";
import { computeConfidence } from "./confidence.js";
import { computeRisk } from "./risk.js";
import { generateInsights } from "./insights.js";
import { generateSummary } from "./summary.js";

/** Total-variation agreement between two outcome distributions (0..1). */
function modelAgreement(a: Outcome, b: Outcome): number {
  const tvd =
    (Math.abs(a.homeWin - b.homeWin) +
      Math.abs(a.draw - b.draw) +
      Math.abs(a.awayWin - b.awayWin)) /
    200; // /100 to fractions, /2 for TVD
  return 1 - tvd;
}

function blend(a: Outcome, b: Outcome, wA: number): Outcome {
  const wB = 1 - wA;
  const raw = {
    homeWin: a.homeWin * wA + b.homeWin * wB,
    draw: a.draw * wA + b.draw * wB,
    awayWin: a.awayWin * wA + b.awayWin * wB,
  };
  const sum = raw.homeWin + raw.draw + raw.awayWin || 1;
  return {
    homeWin: (raw.homeWin / sum) * 100,
    draw: (raw.draw / sum) * 100,
    awayWin: (raw.awayWin / sum) * 100,
  };
}

function toTeamSummary(team: Team, form: RecentMatch[]): TeamSummary {
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    elo: team.elo,
    form: form.map((m) => m.result),
    stats: { ...team.stats },
    recentMatches: form,
  };
}

/** Round outcome percentages to integers that still sum to 100. */
function roundOutcome(o: Outcome): Outcome {
  const entries: Array<[keyof Outcome, number]> = [
    ["homeWin", o.homeWin],
    ["draw", o.draw],
    ["awayWin", o.awayWin],
  ];
  const floored = entries.map(([k, v]) => ({ k, floor: Math.floor(v), frac: v - Math.floor(v) }));
  let remainder = 100 - floored.reduce((s, f) => s + f.floor, 0);
  floored.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < floored.length && remainder > 0; i++, remainder--) floored[i].floor++;
  const result = {} as Outcome;
  for (const f of floored) result[f.k] = f.floor;
  return result;
}

/**
 * The full pipeline: pull data → weighted strength model + Poisson scoreline
 * model → blend → confidence/risk/insights/summary. Pure given the provider.
 */
export async function analyzeMatch(
  provider: MatchDataProvider,
  homeId: number,
  awayId: number,
  now: string,
): Promise<MatchAnalysis> {
  const [home, away] = await Promise.all([provider.getTeam(homeId), provider.getTeam(awayId)]);
  if (!home) throw new Error(`Unknown home team id ${homeId}`);
  if (!away) throw new Error(`Unknown away team id ${awayId}`);
  if (homeId === awayId) throw new Error("A team cannot play itself");

  const [homeForm, awayForm, h2h] = await Promise.all([
    provider.getRecentForm(homeId),
    provider.getRecentForm(awayId),
    provider.getHeadToHead(homeId, awayId),
  ]);

  const weighted = predict(home, away, homeForm, awayForm, h2h);
  const poisson = poissonModel(weighted.lambdaHome, weighted.lambdaAway);

  // Final outcome: lean on the strength model, corroborated by the scoreline
  // model. Their agreement feeds confidence + risk.
  const agreement = modelAgreement(weighted.outcome, poisson.outcome);
  const blended = blend(weighted.outcome, poisson.outcome, 0.55);

  const avgConsistency = (formConsistency(homeForm) + formConsistency(awayForm)) / 2;

  const confidence = computeConfidence({
    outcome: blended,
    signal: weighted.signal,
    modelAgreement: agreement,
    formConsistency: avgConsistency,
  });

  const risk = computeRisk({
    signal: weighted.signal,
    modelAgreement: agreement,
    formConsistency: avgConsistency,
    h2h,
  });

  const expectedGoals = {
    home: weighted.lambdaHome,
    away: weighted.lambdaAway,
    total: weighted.lambdaHome + weighted.lambdaAway,
  };

  const topScores = poisson.scoreLines.slice(0, 5);

  const insights = generateInsights({
    home,
    away,
    outcome: blended,
    signal: weighted.signal,
    lambdaHome: weighted.lambdaHome,
    lambdaAway: weighted.lambdaAway,
    factors: weighted.factors,
    h2h,
    riskScore: risk.score,
  });

  const summary = generateSummary({
    home,
    away,
    homeForm,
    awayForm,
    outcome: blended,
    signal: weighted.signal,
    expectedGoals,
    topScore: topScores[0],
    h2h,
    confidenceLabel: confidence.label,
  });

  return {
    home: toTeamSummary(home, homeForm),
    away: toTeamSummary(away, awayForm),
    outcome: roundOutcome(blended),
    expectedGoals: {
      home: Number(expectedGoals.home.toFixed(2)),
      away: Number(expectedGoals.away.toFixed(2)),
      total: Number(expectedGoals.total.toFixed(2)),
    },
    confidence,
    risk,
    topScores: topScores.map((s) => ({ ...s, probability: Number(s.probability.toFixed(1)) })),
    scoreMatrix: poisson.matrix.map((row) => row.map((p) => Number((p * 100).toFixed(2)))),
    factors: weighted.factors.map((f) => ({
      ...f,
      signal: Number(f.signal.toFixed(3)),
      contribution: Number(f.contribution.toFixed(3)),
    })),
    headToHead: h2h,
    insights,
    summary,
    generatedAt: now,
  };
}
