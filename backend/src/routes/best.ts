import { Router } from "express";
import { getProvider } from "../data/provider.js";
import { analyzeMatch } from "../engine/index.js";
import { generateDailyFixtures } from "../fixtures.js";

export const bestRouter = Router();

// Small in-memory cache so the (heavier) daily slate isn't recomputed per hit.
let cache: { date: string; rows: unknown[] } | null = null;

/**
 * GET /api/best-today — top fixtures ranked by confidence.
 * Returns a compact row per match for the leaderboard table.
 */
bestRouter.get("/", async (_req, res, next) => {
  try {
    const provider = getProvider();
    const date = new Date().toISOString().slice(0, 10);

    if (cache && cache.date === date) {
      res.json({ date, matches: cache.rows });
      return;
    }

    const teams = await provider.listTeams();
    const fixtures = generateDailyFixtures(date, teams.map((t) => t.id), 20);
    const now = new Date().toISOString();

    const analyses = await Promise.all(
      fixtures.map((f) => analyzeMatch(provider, f.homeId, f.awayId, now)),
    );

    const rows = analyses
      .map((a) => {
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

    cache = { date, rows };
    res.json({ date, matches: rows });
  } catch (err) {
    next(err);
  }
});
