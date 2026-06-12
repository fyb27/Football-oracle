import type { Team, HeadToHead } from "../data/types.js";
import type { Insight, Outcome, FactorContribution } from "./types.js";

export interface InsightContext {
  home: Team;
  away: Team;
  outcome: Outcome;
  signal: number;
  lambdaHome: number;
  lambdaAway: number;
  factors: FactorContribution[];
  h2h: HeadToHead;
  riskScore: number;
}

/**
 * Generates the AI insight chips from model outputs using interpretable rules.
 * Each rule reads a model quantity and, when its threshold trips, contributes a
 * short human-readable signal. Returns the most relevant 3–6.
 */
export function generateInsights(ctx: InsightContext): Insight[] {
  const out: Insight[] = [];
  const total = ctx.lambdaHome + ctx.lambdaAway;
  const homeAdv = ctx.factors.find((f) => f.key === "homeAdvantage");
  const favouriteIsHome = ctx.signal > 0;
  const favourite = favouriteIsHome ? ctx.home : ctx.away;
  const underdog = favouriteIsHome ? ctx.away : ctx.home;
  const underdogWin = favouriteIsHome ? ctx.outcome.awayWin : ctx.outcome.homeWin;

  // Strength of the matchup.
  if (Math.abs(ctx.signal) >= 0.5) {
    out.push({
      icon: "🎯",
      title: `${favourite.name} are clear favourites on the model.`,
      tone: "positive",
    });
  } else if (Math.abs(ctx.signal) < 0.12) {
    out.push({
      icon: "⚖️",
      title: "Evenly matched — this is close to a coin-flip.",
      tone: "neutral",
    });
  }

  // Home advantage.
  if (favouriteIsHome && ctx.signal > 0.18 && (homeAdv?.contribution ?? 0) > 0.015) {
    out.push({ icon: "🏟️", title: "Strong home advantage detected.", tone: "positive" });
  }

  // Goal environment.
  if (ctx.lambdaHome > 1.1 && ctx.lambdaAway > 1.1) {
    out.push({
      icon: "⚽",
      title: "High probability of both teams scoring.",
      tone: "neutral",
    });
  }
  if (total < 2.2) {
    out.push({ icon: "🧱", title: "Low-scoring match expected.", tone: "neutral" });
  } else if (total > 3.2) {
    out.push({ icon: "🔥", title: "High-scoring, open match expected.", tone: "neutral" });
  }

  // Upset warning — underdog with a live chance, or a high-risk profile.
  if ((underdogWin >= 30 && Math.abs(ctx.signal) >= 0.25) || ctx.riskScore >= 62) {
    out.push({
      icon: "⚠️",
      title: `Potential upset warning — ${underdog.name} have a real chance.`,
      tone: "warning",
    });
  }

  // Defensive mismatch — a strong attack against a leaky defence.
  const homeAttackVsAwayDef = ctx.home.stats.xgFor - ctx.away.stats.xgAgainst;
  const awayAttackVsHomeDef = ctx.away.stats.xgFor - ctx.home.stats.xgAgainst;
  if (homeAttackVsAwayDef > 0.8) {
    out.push({
      icon: "🛡️",
      title: `Defensive mismatch — ${ctx.home.name}'s attack vs ${ctx.away.name}'s defence.`,
      tone: favouriteIsHome ? "positive" : "warning",
    });
  } else if (awayAttackVsHomeDef > 0.8) {
    out.push({
      icon: "🛡️",
      title: `Defensive mismatch — ${ctx.away.name}'s attack vs ${ctx.home.name}'s defence.`,
      tone: favouriteIsHome ? "warning" : "positive",
    });
  }

  // H2H dominance.
  if (ctx.h2h.meetings >= 4) {
    if (ctx.h2h.homeWins >= ctx.h2h.meetings * 0.6) {
      out.push({
        icon: "📊",
        title: `${ctx.home.name} dominate the head-to-head record.`,
        tone: "positive",
      });
    } else if (ctx.h2h.awayWins >= ctx.h2h.meetings * 0.6) {
      out.push({
        icon: "📊",
        title: `${ctx.away.name} dominate the head-to-head record.`,
        tone: "positive",
      });
    }
  }

  // De-duplicate by title and cap to keep the panel focused.
  const seen = new Set<string>();
  return out.filter((i) => (seen.has(i.title) ? false : (seen.add(i.title), true))).slice(0, 6);
}
