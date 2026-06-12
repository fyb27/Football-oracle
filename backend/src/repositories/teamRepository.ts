import { getDb } from "../db/database.js";
import type { Team } from "../data/types.js";

interface TeamRow {
  id: number;
  name: string;
  code: string;
  group_name: string;
  elo: number;
  win_rate: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  xg_for: number;
  xg_against: number;
  clean_sheet_rate: number;
  possession: number;
  shots_per_match: number;
  pass_accuracy: number;
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    group: row.group_name,
    elo: row.elo,
    stats: {
      winRate: row.win_rate,
      avgGoalsScored: row.avg_goals_scored,
      avgGoalsConceded: row.avg_goals_conceded,
      xgFor: row.xg_for,
      xgAgainst: row.xg_against,
      cleanSheetRate: row.clean_sheet_rate,
      possession: row.possession,
      shotsPerMatch: row.shots_per_match,
      passAccuracy: row.pass_accuracy,
    },
  };
}

const SELECT = `
  SELECT id, name, code, group_name, elo, win_rate, avg_goals_scored,
         avg_goals_conceded, xg_for, xg_against, clean_sheet_rate,
         possession, shots_per_match, pass_accuracy
  FROM teams
`;

export const teamRepository = {
  all(): Team[] {
    const rows = getDb()
      .prepare(`${SELECT} ORDER BY elo DESC`)
      .all() as TeamRow[];
    return rows.map(mapTeam);
  },

  byId(id: number): Team | null {
    const row = getDb()
      .prepare(`${SELECT} WHERE id = ?`)
      .get(id) as TeamRow | undefined;
    return row ? mapTeam(row) : null;
  },
};
