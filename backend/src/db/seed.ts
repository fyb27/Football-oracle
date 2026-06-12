import { getDb } from "./database.js";

/**
 * Deterministic seed data.
 *
 * Real APIs are not assumed to be available, so we synthesise a realistic
 * dataset for 24 national teams: aggregate stats derived from Elo (with light
 * reproducible noise), a last-10 form record per team, and a head-to-head
 * history for every pair. Everything is generated from a fixed RNG seed, so
 * re-seeding always yields the same numbers — predictions are reproducible.
 *
 * Swap this whole file out (or the provider in data/provider.ts) when wiring a
 * real data source; nothing downstream depends on how the rows got here.
 */

// ---- Deterministic RNG (mulberry32) ---------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260612);
const rand = (lo: number, hi: number) => lo + rng() * (hi - lo);
const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1));

// ---- Base roster -----------------------------------------------------------
interface BaseTeam {
  name: string;
  code: string;
  group: string;
  elo: number;
}
// A 48-team World Cup field across all confederations. The three hosts
// (USA, Canada, Mexico) are always included. Elo ratings are approximate and
// only seed the model; the underlying data is synthetic/historical.
const ROSTER: BaseTeam[] = [
  { name: "Argentina", code: "ARG", group: "South America", elo: 2095 },
  { name: "France", code: "FRA", group: "Europe", elo: 2050 },
  { name: "Spain", code: "ESP", group: "Europe", elo: 2040 },
  { name: "England", code: "ENG", group: "Europe", elo: 2000 },
  { name: "Brazil", code: "BRA", group: "South America", elo: 1990 },
  { name: "Portugal", code: "POR", group: "Europe", elo: 1970 },
  { name: "Netherlands", code: "NED", group: "Europe", elo: 1958 },
  { name: "Belgium", code: "BEL", group: "Europe", elo: 1940 },
  { name: "Italy", code: "ITA", group: "Europe", elo: 1930 },
  { name: "Germany", code: "GER", group: "Europe", elo: 1925 },
  { name: "Croatia", code: "CRO", group: "Europe", elo: 1880 },
  { name: "Uruguay", code: "URU", group: "South America", elo: 1872 },
  { name: "Morocco", code: "MAR", group: "Africa", elo: 1860 },
  { name: "Colombia", code: "COL", group: "South America", elo: 1842 },
  { name: "Denmark", code: "DEN", group: "Europe", elo: 1830 },
  { name: "Switzerland", code: "SUI", group: "Europe", elo: 1820 },
  { name: "Japan", code: "JPN", group: "Asia", elo: 1812 },
  { name: "Mexico", code: "MEX", group: "North America", elo: 1805 },
  { name: "Senegal", code: "SEN", group: "Africa", elo: 1800 },
  { name: "USA", code: "USA", group: "North America", elo: 1790 },
  { name: "Ecuador", code: "ECU", group: "South America", elo: 1785 },
  { name: "Austria", code: "AUT", group: "Europe", elo: 1780 },
  { name: "Ukraine", code: "UKR", group: "Europe", elo: 1770 },
  { name: "South Korea", code: "KOR", group: "Asia", elo: 1762 },
  { name: "Türkiye", code: "TUR", group: "Europe", elo: 1758 },
  { name: "Sweden", code: "SWE", group: "Europe", elo: 1752 },
  { name: "Serbia", code: "SRB", group: "Europe", elo: 1748 },
  { name: "Poland", code: "POL", group: "Europe", elo: 1744 },
  { name: "Nigeria", code: "NGA", group: "Africa", elo: 1742 },
  { name: "Wales", code: "WAL", group: "Europe", elo: 1738 },
  { name: "Australia", code: "AUS", group: "Asia", elo: 1730 },
  { name: "Egypt", code: "EGY", group: "Africa", elo: 1728 },
  { name: "Canada", code: "CAN", group: "North America", elo: 1726 },
  { name: "Czechia", code: "CZE", group: "Europe", elo: 1720 },
  { name: "Norway", code: "NOR", group: "Europe", elo: 1716 },
  { name: "Hungary", code: "HUN", group: "Europe", elo: 1712 },
  { name: "Peru", code: "PER", group: "South America", elo: 1708 },
  { name: "Scotland", code: "SCO", group: "Europe", elo: 1704 },
  { name: "Algeria", code: "ALG", group: "Africa", elo: 1700 },
  { name: "Ivory Coast", code: "CIV", group: "Africa", elo: 1694 },
  { name: "Cameroon", code: "CMR", group: "Africa", elo: 1686 },
  { name: "Iran", code: "IRN", group: "Asia", elo: 1680 },
  { name: "Greece", code: "GRE", group: "Europe", elo: 1674 },
  { name: "Ghana", code: "GHA", group: "Africa", elo: 1668 },
  { name: "Paraguay", code: "PAR", group: "South America", elo: 1660 },
  { name: "Tunisia", code: "TUN", group: "Africa", elo: 1654 },
  { name: "Saudi Arabia", code: "KSA", group: "Asia", elo: 1648 },
  { name: "Costa Rica", code: "CRC", group: "North America", elo: 1640 },
];

/** Maps Elo to a 0..1 strength used to derive plausible aggregate stats. */
function strengthOf(elo: number) {
  return Math.max(0, Math.min(1, (elo - 1700) / 400));
}

interface SeedStats {
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
function statsFor(elo: number): SeedStats {
  const s = strengthOf(elo);
  const n = () => rand(-0.08, 0.08); // light noise so stats aren't perfectly monotonic
  const avgGoalsScored = +(1.0 + s * 1.3 + n()).toFixed(2);
  const avgGoalsConceded = +(1.6 - s * 0.9 + n()).toFixed(2);
  return {
    winRate: +(0.35 + s * 0.4 + n() * 0.3).toFixed(2),
    avgGoalsScored,
    avgGoalsConceded: Math.max(0.4, avgGoalsConceded),
    xgFor: +(avgGoalsScored * rand(0.9, 1.08)).toFixed(2),
    xgAgainst: +(avgGoalsConceded * rand(0.9, 1.08)).toFixed(2),
    cleanSheetRate: +(0.2 + s * 0.35 + n() * 0.2).toFixed(2),
    possession: +(0.43 + s * 0.17 + n() * 0.1).toFixed(2),
    shotsPerMatch: +(9 + s * 8 + n() * 4).toFixed(1),
    passAccuracy: +(0.75 + s * 0.15 + n() * 0.05).toFixed(2),
  };
}

// ---- Date helpers (fixed base for reproducibility) -------------------------
const BASE = Date.UTC(2026, 5, 1); // 2026-06-01
const DAY = 86400000;
const isoDaysAgo = (days: number) => new Date(BASE - days * DAY).toISOString().slice(0, 10);

/** Samples a plausible scoreline given attacking/defensive averages. */
function sampleScore(attA: number, defB: number, attB: number, defA: number) {
  const lamA = Math.max(0.2, (attA + defB) / 2);
  const lamB = Math.max(0.2, (attB + defA) / 2);
  const draw = (lam: number) => {
    // crude Poisson sampling via inverse-CDF on the deterministic RNG
    const u = rng();
    let p = Math.exp(-lam);
    let cum = p;
    let k = 0;
    while (u > cum && k < 7) {
      k++;
      p *= lam / k;
      cum += p;
    }
    return k;
  };
  return { a: draw(lamA), b: draw(lamB) };
}

// ---- Seeding ---------------------------------------------------------------
export function seed(force = false) {
  const db = getDb();

  const count = (db.prepare("SELECT COUNT(*) AS n FROM teams").get() as { n: number }).n;
  if (count > 0 && !force) return { seeded: false, teams: count };

  const tx = db.transaction(() => {
    db.exec(
      "DELETE FROM h2h_matches; DELETE FROM recent_matches; DELETE FROM saved_predictions; DELETE FROM teams;",
    );

    const insertTeam = db.prepare(
      `INSERT INTO teams (name, code, group_name, elo, win_rate, avg_goals_scored,
         avg_goals_conceded, xg_for, xg_against, clean_sheet_rate, possession,
         shots_per_match, pass_accuracy)
       VALUES (@name, @code, @group, @elo, @winRate, @avgGoalsScored,
         @avgGoalsConceded, @xgFor, @xgAgainst, @cleanSheetRate, @possession,
         @shotsPerMatch, @passAccuracy)`,
    );

    const ids: number[] = [];
    const teams = ROSTER.map((t) => {
      const stats = statsFor(t.elo);
      const info = insertTeam.run({ ...t, ...stats });
      const id = Number(info.lastInsertRowid);
      ids.push(id);
      return { id, ...t, stats };
    });

    // Recent form: last 10 matches per team, scorelines sampled from averages.
    const insertRecent = db.prepare(
      `INSERT INTO recent_matches (team_id, opponent, is_home, goals_for, goals_against, result, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const team of teams) {
      for (let i = 0; i < 10; i++) {
        const opp = teams[randInt(0, teams.length - 1)];
        const oppId = opp.id === team.id ? teams[(teams.indexOf(opp) + 1) % teams.length] : opp;
        const isHome = rng() > 0.5;
        const score = sampleScore(
          team.stats.avgGoalsScored,
          oppId.stats.avgGoalsConceded,
          oppId.stats.avgGoalsScored,
          team.stats.avgGoalsConceded,
        );
        const gf = score.a;
        const ga = score.b;
        const result = gf > ga ? "W" : gf < ga ? "L" : "D";
        insertRecent.run(team.id, oppId.name, isHome ? 1 : 0, gf, ga, result, isoDaysAgo(i * 7 + 3));
      }
    }

    // Head-to-head: a few historical meetings for every unordered pair.
    const insertH2H = db.prepare(
      `INSERT INTO h2h_matches (home_team_id, away_team_id, home_goals, away_goals, competition, played_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const comps = ["World Cup", "Friendly", "Nations League", "Continental Cup", "Qualifier"];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const a = teams[i];
        const b = teams[j];
        const meetings = randInt(2, 6);
        for (let m = 0; m < meetings; m++) {
          const aHome = rng() > 0.5;
          const home = aHome ? a : b;
          const away = aHome ? b : a;
          const score = sampleScore(
            home.stats.avgGoalsScored,
            away.stats.avgGoalsConceded,
            away.stats.avgGoalsScored,
            home.stats.avgGoalsConceded,
          );
          insertH2H.run(
            home.id,
            away.id,
            score.a,
            score.b,
            comps[randInt(0, comps.length - 1)],
            isoDaysAgo(180 + m * 220 + randInt(0, 120)),
          );
        }
      }
    }

    return ids.length;
  });

  const n = tx();
  return { seeded: true, teams: n };
}

// Allow `npm run seed` to run this file directly.
const isDirectRun = process.argv[1] && process.argv[1].includes("seed");
if (isDirectRun) {
  const result = seed(true);
  // eslint-disable-next-line no-console
  console.log(`Seeded database: ${result.teams} teams.`);
}
