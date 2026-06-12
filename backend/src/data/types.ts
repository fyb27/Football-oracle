/**
 * Domain types. These describe the *shape of football data* the prediction
 * engine consumes — independent of where the data comes from (SQLite today,
 * a real stats API tomorrow). The frontend mirrors the response types in
 * `frontend/src/types.ts`; keep them in sync.
 */

export type MatchResult = "W" | "D" | "L";

/** Aggregate, slow-moving stats for a team. */
export interface TeamStats {
  /** Rolling win rate across all competitions, 0..1. */
  winRate: number;
  /** Average goals scored per match. */
  avgGoalsScored: number;
  /** Average goals conceded per match. */
  avgGoalsConceded: number;
  /** Expected goals for, per match. */
  xgFor: number;
  /** Expected goals against, per match. */
  xgAgainst: number;
  /** Share of matches ending in a clean sheet, 0..1. */
  cleanSheetRate: number;
  /** Average possession, 0..1. */
  possession: number;
  /** Average shots per match. */
  shotsPerMatch: number;
  /** Pass completion rate, 0..1. */
  passAccuracy: number;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  /** Confederation / group label, used only for display + grouping. */
  group: string;
  /** Elo rating — the backbone of the strength model. */
  elo: number;
  stats: TeamStats;
}

/** A single match in a team's recent history (for form). */
export interface RecentMatch {
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: MatchResult;
  playedAt: string; // ISO date
}

/** Head-to-head record between two specific teams. */
export interface HeadToHead {
  meetings: number;
  homeWins: number; // wins for the queried home team
  draws: number;
  awayWins: number; // wins for the queried away team
  homeGoals: number;
  awayGoals: number;
  recent: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
    competition: string;
  }>;
}

/**
 * The data-access contract. Any provider (local DB, external API, cache) that
 * implements this interface can drive the engine. This is the seam that makes
 * "plug in a real API later" a one-file change.
 */
export interface MatchDataProvider {
  listTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | null>;
  getRecentForm(teamId: number, limit?: number): Promise<RecentMatch[]>;
  getHeadToHead(homeTeamId: number, awayTeamId: number): Promise<HeadToHead>;
}
