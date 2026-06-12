// Internal engine data types (mirror of the original backend domain model).
import type { RecentMatch, HeadToHead } from "../types";

export interface TeamStats {
  winRate: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  xgFor: number;
  xgAgainst: number;
  cleanSheetRate: number;
  possession: number;
  shotsPerMatch: number;
  passAccuracy: number;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  group: string;
  elo: number;
  stats: TeamStats;
}

/** Data-access contract — implemented by the static (bundled-JSON) provider. */
export interface MatchDataProvider {
  listTeams(): Team[];
  getTeam(id: number): Team | null;
  getRecentForm(teamId: number, limit?: number): RecentMatch[];
  getHeadToHead(homeTeamId: number, awayTeamId: number): HeadToHead;
}
