/**
 * Elo rating model — logistic expected score with an additive home-field
 * advantage (in rating points). Expected score is the home team's probability
 * of "winning" a 0..1 contest (win = 1, draw = 0.5).
 */
export const HOME_FIELD_ADVANTAGE = 70;

export function expectedScore(
  homeElo: number,
  awayElo: number,
  hfa = HOME_FIELD_ADVANTAGE,
): number {
  return 1 / (1 + Math.pow(10, (awayElo - (homeElo + hfa)) / 400));
}
