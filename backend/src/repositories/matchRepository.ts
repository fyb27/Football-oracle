import { getDb } from "../db/database.js";
import type { RecentMatch, HeadToHead, MatchResult } from "../data/types.js";

interface RecentRow {
  opponent: string;
  is_home: number;
  goals_for: number;
  goals_against: number;
  result: MatchResult;
  played_at: string;
}

interface H2HRow {
  home_team_id: number;
  away_team_id: number;
  home_goals: number;
  away_goals: number;
  competition: string;
  played_at: string;
  home_name: string;
  away_name: string;
}

export const matchRepository = {
  recentForm(teamId: number, limit = 10): RecentMatch[] {
    const rows = getDb()
      .prepare(
        `SELECT opponent, is_home, goals_for, goals_against, result, played_at
         FROM recent_matches WHERE team_id = ?
         ORDER BY played_at DESC LIMIT ?`,
      )
      .all(teamId, limit) as RecentRow[];

    return rows.map((r) => ({
      opponent: r.opponent,
      isHome: r.is_home === 1,
      goalsFor: r.goals_for,
      goalsAgainst: r.goals_against,
      result: r.result,
      playedAt: r.played_at,
    }));
  },

  headToHead(homeId: number, awayId: number): HeadToHead {
    // Pull every meeting between the pair in either orientation.
    const rows = getDb()
      .prepare(
        `SELECT h.home_team_id, h.away_team_id, h.home_goals, h.away_goals,
                h.competition, h.played_at,
                ht.name AS home_name, at.name AS away_name
         FROM h2h_matches h
         JOIN teams ht ON ht.id = h.home_team_id
         JOIN teams at ON at.id = h.away_team_id
         WHERE (h.home_team_id = ? AND h.away_team_id = ?)
            OR (h.home_team_id = ? AND h.away_team_id = ?)
         ORDER BY h.played_at DESC`,
      )
      .all(homeId, awayId, awayId, homeId) as H2HRow[];

    const h2h: HeadToHead = {
      meetings: rows.length,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      homeGoals: 0,
      awayGoals: 0,
      recent: [],
    };

    for (const r of rows) {
      // Normalise every meeting to the perspective of the *queried* home team.
      const queriedHomeWasHome = r.home_team_id === homeId;
      const goalsForQueriedHome = queriedHomeWasHome ? r.home_goals : r.away_goals;
      const goalsForQueriedAway = queriedHomeWasHome ? r.away_goals : r.home_goals;

      h2h.homeGoals += goalsForQueriedHome;
      h2h.awayGoals += goalsForQueriedAway;

      if (goalsForQueriedHome > goalsForQueriedAway) h2h.homeWins++;
      else if (goalsForQueriedHome < goalsForQueriedAway) h2h.awayWins++;
      else h2h.draws++;
    }

    h2h.recent = rows.slice(0, 6).map((r) => ({
      date: r.played_at,
      homeTeam: r.home_name,
      awayTeam: r.away_name,
      homeGoals: r.home_goals,
      awayGoals: r.away_goals,
      competition: r.competition,
    }));

    return h2h;
  },

  savePrediction(homeId: number, awayId: number, payload: unknown, createdAt: string): number {
    const info = getDb()
      .prepare(
        `INSERT INTO saved_predictions (home_team_id, away_team_id, payload, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(homeId, awayId, JSON.stringify(payload), createdAt);
    return Number(info.lastInsertRowid);
  },
};
