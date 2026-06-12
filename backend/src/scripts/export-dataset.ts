/**
 * Exports the seeded dataset to a static JSON file the browser app bundles, so
 * the frontend can run the whole engine client-side with no backend.
 *
 * Run with:  npm run export:data
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { getDb } from "../db/database.js";
import { seed } from "../db/seed.js";
import { teamRepository } from "../repositories/teamRepository.js";
import { matchRepository } from "../repositories/matchRepository.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start from a pristine DB so ids are a clean 1..N and the export is fully
// reproducible (AUTOINCREMENT otherwise continues from a prior seed).
if (config.dbPath !== ":memory:") {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(config.dbPath + suffix, { force: true });
  }
}
getDb();
seed(true);

const teams = teamRepository.all();

const form: Record<number, ReturnType<typeof matchRepository.recentForm>> = {};
for (const t of teams) form[t.id] = matchRepository.recentForm(t.id, 10);

// Raw head-to-head meetings; the client recomputes per-pair records.
interface MeetingRow {
  home_team_id: number;
  away_team_id: number;
  home_goals: number;
  away_goals: number;
  competition: string;
  played_at: string;
}
const meetings = getDb()
  .prepare(
    `SELECT home_team_id, away_team_id, home_goals, away_goals, competition, played_at
     FROM h2h_matches ORDER BY played_at DESC`,
  )
  .all() as MeetingRow[];

const dataset = {
  generatedFrom: "seed:20260612",
  teams,
  form,
  meetings: meetings.map((m) => ({
    homeId: m.home_team_id,
    awayId: m.away_team_id,
    homeGoals: m.home_goals,
    awayGoals: m.away_goals,
    competition: m.competition,
    playedAt: m.played_at,
  })),
};

const outPath = join(__dirname, "../../../frontend/src/data/dataset.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(dataset));
// eslint-disable-next-line no-console
console.log(
  `Exported dataset → ${outPath}\n  teams: ${teams.length}, meetings: ${meetings.length}`,
);
