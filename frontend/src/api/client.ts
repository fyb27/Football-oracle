import type { TeamListItem, MatchAnalysis, BestMatchRow } from "../types";
import { StaticProvider } from "../data/staticProvider";
import { analyzeMatch } from "../engine/analyze";
import { generateDailyFixtures } from "../engine/fixtures";

/**
 * The "API" now runs entirely in the browser against the bundled dataset —
 * there is no backend to deploy. The async signatures are kept so the rest of
 * the app is unchanged, and so this file is the single seam to swap back to a
 * real network API later (just make these methods `fetch` instead).
 */
const provider = new StaticProvider();

// Cache the daily slate so navigating back to "Best Today" is instant.
let bestCache: { date: string; matches: BestMatchRow[] } | null = null;

export const api = {
  async listTeams(): Promise<TeamListItem[]> {
    return provider.listTeams().map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      group: t.group,
      elo: Math.round(t.elo),
    }));
  },

  async predict(homeId: number, awayId: number): Promise<MatchAnalysis> {
    return analyzeMatch(provider, homeId, awayId, new Date().toISOString());
  },

  async bestToday(): Promise<{ date: string; matches: BestMatchRow[] }> {
    const date = new Date().toISOString().slice(0, 10);
    if (bestCache && bestCache.date === date) return bestCache;

    const teams = provider.listTeams();
    const fixtures = generateDailyFixtures(date, teams.map((t) => t.id), 20);
    const now = new Date().toISOString();

    const matches: BestMatchRow[] = fixtures
      .map((f) => {
        const a = analyzeMatch(provider, f.homeId, f.awayId, now);
        const top = Math.max(a.outcome.homeWin, a.outcome.draw, a.outcome.awayWin);
        const winPrediction =
          top === a.outcome.homeWin
            ? `${a.home.name} win`
            : top === a.outcome.awayWin
              ? `${a.away.name} win`
              : "Draw";
        return {
          homeId: a.home.id,
          awayId: a.away.id,
          match: `${a.home.name} vs ${a.away.name}`,
          homeName: a.home.name,
          awayName: a.away.name,
          homeCode: a.home.code,
          awayCode: a.away.code,
          winPrediction,
          outcome: a.outcome,
          confidence: a.confidence.score,
          confidenceLabel: a.confidence.label,
          risk: a.risk.level,
          expectedGoals: a.expectedGoals.total,
          mostLikelyScore: a.topScores[0].label,
          mostLikelyScoreProb: a.topScores[0].probability,
        };
      })
      .sort((x, y) => y.confidence - x.confidence);

    bestCache = { date, matches };
    return bestCache;
  },
};
