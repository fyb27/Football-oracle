import type { RecentMatch, HeadToHead } from "../types";
import type { MatchDataProvider, Team } from "../engine/dataTypes";
import datasetJson from "./dataset.json";

interface Meeting {
  homeId: number;
  awayId: number;
  homeGoals: number;
  awayGoals: number;
  competition: string;
  playedAt: string;
}
interface Dataset {
  groups: Record<string, string[]>;
  teams: Team[];
  form: Record<string, RecentMatch[]>;
  meetings: Meeting[];
}

const dataset = datasetJson as unknown as Dataset;
const teamsById = new Map<number, Team>(dataset.teams.map((t) => [t.id, t]));

/** The official 2026 World Cup group draw (A–L → team names). */
export const GROUPS: Record<string, string[]> = dataset.groups;

/**
 * Reads the bundled seed dataset entirely in the browser — no network, no
 * backend. Implements the same contract the engine expects, so the rest of the
 * pipeline is unchanged. (To use a real API later, implement this interface
 * against your fetch calls and swap it in `oracle.ts`.)
 */
export class StaticProvider implements MatchDataProvider {
  listTeams(): Team[] {
    return [...dataset.teams].sort((a, b) => b.elo - a.elo);
  }

  getTeam(id: number): Team | null {
    return teamsById.get(id) ?? null;
  }

  getRecentForm(teamId: number, limit = 10): RecentMatch[] {
    const form = dataset.form[String(teamId)] ?? [];
    return form.slice(0, limit);
  }

  getHeadToHead(homeId: number, awayId: number): HeadToHead {
    const rows = dataset.meetings
      .filter(
        (m) =>
          (m.homeId === homeId && m.awayId === awayId) ||
          (m.homeId === awayId && m.awayId === homeId),
      )
      .sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));

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
      // Normalise every meeting to the queried home team's perspective.
      const queriedHomeWasHome = r.homeId === homeId;
      const gForHome = queriedHomeWasHome ? r.homeGoals : r.awayGoals;
      const gForAway = queriedHomeWasHome ? r.awayGoals : r.homeGoals;
      h2h.homeGoals += gForHome;
      h2h.awayGoals += gForAway;
      if (gForHome > gForAway) h2h.homeWins++;
      else if (gForHome < gForAway) h2h.awayWins++;
      else h2h.draws++;
    }

    h2h.recent = rows.slice(0, 6).map((r) => ({
      date: r.playedAt,
      homeTeam: teamsById.get(r.homeId)?.name ?? "?",
      awayTeam: teamsById.get(r.awayId)?.name ?? "?",
      homeGoals: r.homeGoals,
      awayGoals: r.awayGoals,
      competition: r.competition,
    }));

    return h2h;
  }
}
