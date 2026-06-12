/**
 * Elo rating model — the backbone of team strength.
 *
 * Standard logistic Elo with an additive home-field advantage expressed in
 * rating points. The expected score is the probability the home team "wins"
 * a match treated as a 0..1 contest (win = 1, draw = 0.5).
 */

/** Home-field advantage in Elo points (~empirically 60–100 for football). */
export const HOME_FIELD_ADVANTAGE = 70;

/**
 * Expected score for the home team in 0..1 given both ratings.
 * @param homeElo rating of the home team
 * @param awayElo rating of the away team
 * @param hfa home-field advantage in Elo points
 */
export function expectedScore(
  homeElo: number,
  awayElo: number,
  hfa = HOME_FIELD_ADVANTAGE,
): number {
  return 1 / (1 + Math.pow(10, (awayElo - (homeElo + hfa)) / 400));
}

/**
 * Updates two ratings after a result. Not used in live prediction, but kept so
 * ratings can be recomputed from history when real results arrive.
 * @param actualHome 1 win, 0.5 draw, 0 loss for the home team
 * @param k sensitivity factor
 */
export function updateElo(
  homeElo: number,
  awayElo: number,
  actualHome: number,
  k = 30,
): { home: number; away: number } {
  const exp = expectedScore(homeElo, awayElo);
  const delta = k * (actualHome - exp);
  return { home: homeElo + delta, away: awayElo - delta };
}
