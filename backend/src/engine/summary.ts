import type { Team, RecentMatch, HeadToHead } from "../data/types.js";
import type { Outcome, ScoreLine } from "./types.js";
import { formScore } from "./prediction.js";

export interface SummaryContext {
  home: Team;
  away: Team;
  homeForm: RecentMatch[];
  awayForm: RecentMatch[];
  outcome: Outcome;
  signal: number;
  expectedGoals: { home: number; away: number };
  topScore: ScoreLine;
  h2h: HeadToHead;
  confidenceLabel: string;
}

/**
 * Produces the natural-language match summary. It is fully data-driven: every
 * clause is selected from the model's own quantities, so the narrative always
 * matches the numbers above it. (Swap this for an LLM call behind the same
 * signature to get a generative summary — the inputs are already assembled.)
 */
export function generateSummary(ctx: SummaryContext): string {
  const favHome = ctx.signal >= 0;
  const fav = favHome ? ctx.home : ctx.away;
  const dog = favHome ? ctx.away : ctx.home;
  const favWin = favHome ? ctx.outcome.homeWin : ctx.outcome.awayWin;
  const eloGap = Math.abs(ctx.home.elo - ctx.away.elo);

  const sentences: string[] = [];

  // 1. Headline edge.
  const edgeWord =
    Math.abs(ctx.signal) >= 0.5
      ? "a commanding edge"
      : Math.abs(ctx.signal) >= 0.25
        ? "a clear edge"
        : Math.abs(ctx.signal) >= 0.1
          ? "a slight edge"
          : "no meaningful edge";
  if (edgeWord === "no meaningful edge") {
    sentences.push(
      `The model sees ${ctx.home.name} and ${ctx.away.name} as evenly matched, with neither side holding a meaningful statistical edge.`,
    );
  } else {
    sentences.push(
      `The model gives ${fav.name} ${edgeWord} in this fixture, with a ${Math.round(favWin)}% win probability.`,
    );
  }

  // 2. Why — the strongest contributing reasons.
  const reasons: string[] = [];
  if (eloGap >= 40) {
    reasons.push(
      `${(ctx.home.elo > ctx.away.elo ? ctx.home : ctx.away).name} carry the higher Elo rating (${Math.round(Math.max(ctx.home.elo, ctx.away.elo))} vs ${Math.round(Math.min(ctx.home.elo, ctx.away.elo))})`,
    );
  }
  const homeF = formScore(ctx.homeForm);
  const awayF = formScore(ctx.awayForm);
  if (Math.abs(homeF - awayF) >= 0.15) {
    const better = homeF > awayF ? ctx.home : ctx.away;
    reasons.push(`${better.name} arrive in stronger recent form`);
  }
  if (Math.abs(ctx.home.stats.xgFor - ctx.away.stats.xgFor) >= 0.3) {
    const sharper = ctx.home.stats.xgFor > ctx.away.stats.xgFor ? ctx.home : ctx.away;
    reasons.push(`${sharper.name} generate the better attacking output (xG)`);
  }
  if (Math.abs(ctx.home.stats.avgGoalsConceded - ctx.away.stats.avgGoalsConceded) >= 0.3) {
    const tighter =
      ctx.home.stats.avgGoalsConceded < ctx.away.stats.avgGoalsConceded
        ? ctx.home
        : ctx.away;
    reasons.push(`${tighter.name} have been more solid defensively`);
  }
  if (reasons.length > 0) {
    const joined =
      reasons.length === 1
        ? reasons[0]
        : `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}`;
    sentences.push(`Key drivers: ${joined}.`);
  }

  // 3. Goal expectation + most likely scoreline.
  const total = ctx.expectedGoals.home + ctx.expectedGoals.away;
  const tempo =
    total < 2.2 ? "a tight, low-scoring affair" : total > 3.2 ? "an open, high-scoring game" : "a moderately open game";
  sentences.push(
    `Expect ${tempo}: projected goals of ${ctx.expectedGoals.home.toFixed(1)}–${ctx.expectedGoals.away.toFixed(1)}, with ${ctx.topScore.label} the single most likely scoreline (${ctx.topScore.probability.toFixed(0)}%).`,
  );

  // 4. H2H + confidence caveat.
  if (ctx.h2h.meetings >= 3) {
    sentences.push(
      `Historically the pair have met ${ctx.h2h.meetings} times (${ctx.h2h.homeWins}–${ctx.h2h.draws}–${ctx.h2h.awayWins} from ${ctx.home.name}'s view). Overall this is a ${ctx.confidenceLabel.toLowerCase()} call.`,
    );
  } else {
    sentences.push(`Overall this is a ${ctx.confidenceLabel.toLowerCase()} call.`);
  }

  return sentences.join(" ");
}
