import type {
  MatchDataProvider,
  Team,
  RecentMatch,
  HeadToHead,
} from "./types.js";
import { teamRepository } from "../repositories/teamRepository.js";
import { matchRepository } from "../repositories/matchRepository.js";

/**
 * Local SQLite-backed implementation of the data contract.
 *
 * To plug in a real provider later (e.g. a football-data API), create another
 * class implementing `MatchDataProvider`, fetch + map the upstream payloads
 * into our domain types, and export it from `getProvider()` below. The engine
 * and routes never change.
 */
export class LocalDbProvider implements MatchDataProvider {
  async listTeams(): Promise<Team[]> {
    return teamRepository.all();
  }

  async getTeam(id: number): Promise<Team | null> {
    return teamRepository.byId(id);
  }

  async getRecentForm(teamId: number, limit = 10): Promise<RecentMatch[]> {
    return matchRepository.recentForm(teamId, limit);
  }

  async getHeadToHead(homeTeamId: number, awayTeamId: number): Promise<HeadToHead> {
    return matchRepository.headToHead(homeTeamId, awayTeamId);
  }
}

let provider: MatchDataProvider | null = null;

/** Swap the implementation here to change the entire app's data source. */
export function getProvider(): MatchDataProvider {
  if (!provider) provider = new LocalDbProvider();
  return provider;
}
