import { getDb } from "./database.js";

/**
 * Real-data seed for the 2026 FIFA World Cup (hosts: USA, Canada, Mexico).
 *
 * - Roster: the actual 48 qualified teams (confirmed June 2026).
 * - Elo: current World Football Elo ratings from eloratings.net (June 2026
 *   snapshot); five teams without a published value are clearly approximated.
 * - Recent form: REAL last-~10 results for the 22 strongest qualifiers
 *   (sourced from ESPN/Wikipedia results pages). Remaining teams get
 *   deterministic synthetic form derived from their rating.
 * - Aggregate stats (xG, possession, etc.) are derived from Elo — national-team
 *   advanced stats aren't published consistently for all 48, so these are
 *   modelled, not measured.
 * - Head-to-head is synthetic (deterministic) — full real H2H for all 1,128
 *   pairs isn't feasible to bundle.
 *
 * Everything synthetic uses a fixed RNG seed, so predictions are reproducible.
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

// ---- Roster: the 48 qualified teams ---------------------------------------
interface BaseTeam {
  name: string;
  code: string;
  group: string; // confederation, for display
  elo: number;
  eloApprox?: boolean; // true when no published Elo was available
}
const ROSTER: BaseTeam[] = [
  // CONMEBOL
  { name: "Argentina", code: "ARG", group: "South America", elo: 2115 },
  { name: "Brazil", code: "BRA", group: "South America", elo: 1991 },
  { name: "Colombia", code: "COL", group: "South America", elo: 1982 },
  { name: "Ecuador", code: "ECU", group: "South America", elo: 1938 },
  { name: "Uruguay", code: "URU", group: "South America", elo: 1892 },
  { name: "Paraguay", code: "PAR", group: "South America", elo: 1834 },
  // UEFA
  { name: "Spain", code: "ESP", group: "Europe", elo: 2157 },
  { name: "France", code: "FRA", group: "Europe", elo: 2063 },
  { name: "England", code: "ENG", group: "Europe", elo: 2024 },
  { name: "Portugal", code: "POR", group: "Europe", elo: 1989 },
  { name: "Netherlands", code: "NED", group: "Europe", elo: 1948 },
  { name: "Norway", code: "NOR", group: "Europe", elo: 1914 },
  { name: "Croatia", code: "CRO", group: "Europe", elo: 1912 },
  { name: "Türkiye", code: "TUR", group: "Europe", elo: 1911 },
  { name: "Belgium", code: "BEL", group: "Europe", elo: 1894 },
  { name: "Switzerland", code: "SUI", group: "Europe", elo: 1891 },
  { name: "Germany", code: "GER", group: "Europe", elo: 1932 },
  { name: "Austria", code: "AUT", group: "Europe", elo: 1830 },
  { name: "Scotland", code: "SCO", group: "Europe", elo: 1782 },
  { name: "Czechia", code: "CZE", group: "Europe", elo: 1712 },
  { name: "Sweden", code: "SWE", group: "Europe", elo: 1712 },
  { name: "Bosnia & Herzegovina", code: "BIH", group: "Europe", elo: 1595 },
  // CAF
  { name: "Morocco", code: "MAR", group: "Africa", elo: 1827 },
  { name: "Senegal", code: "SEN", group: "Africa", elo: 1860 },
  { name: "Algeria", code: "ALG", group: "Africa", elo: 1772 },
  { name: "Egypt", code: "EGY", group: "Africa", elo: 1696 },
  { name: "Ivory Coast", code: "CIV", group: "Africa", elo: 1695 },
  { name: "South Africa", code: "RSA", group: "Africa", elo: 1645, eloApprox: true },
  { name: "Ghana", code: "GHA", group: "Africa", elo: 1640, eloApprox: true },
  { name: "Tunisia", code: "TUN", group: "Africa", elo: 1628 },
  { name: "DR Congo", code: "COD", group: "Africa", elo: 1652 },
  { name: "Cape Verde", code: "CPV", group: "Africa", elo: 1578 },
  // AFC
  { name: "Japan", code: "JPN", group: "Asia", elo: 1906 },
  { name: "Iran", code: "IRN", group: "Asia", elo: 1772 },
  { name: "South Korea", code: "KOR", group: "Asia", elo: 1786 },
  { name: "Australia", code: "AUS", group: "Asia", elo: 1777 },
  { name: "Qatar", code: "QAT", group: "Asia", elo: 1672, eloApprox: true },
  { name: "Uzbekistan", code: "UZB", group: "Asia", elo: 1714 },
  { name: "Jordan", code: "JOR", group: "Asia", elo: 1680 },
  { name: "Saudi Arabia", code: "KSA", group: "Asia", elo: 1576 },
  { name: "Iraq", code: "IRQ", group: "Asia", elo: 1607 },
  // CONCACAF
  { name: "Mexico", code: "MEX", group: "North America", elo: 1881 },
  { name: "USA", code: "USA", group: "North America", elo: 1726 },
  { name: "Canada", code: "CAN", group: "North America", elo: 1788 },
  { name: "Panama", code: "PAN", group: "North America", elo: 1730 },
  { name: "Curaçao", code: "CUW", group: "North America", elo: 1600, eloApprox: true },
  { name: "Haiti", code: "HAI", group: "North America", elo: 1565, eloApprox: true },
  // OFC
  { name: "New Zealand", code: "NZL", group: "Oceania", elo: 1562 },
];

/** Maps Elo to a 0..1 strength used to derive plausible aggregate stats. */
function strengthOf(elo: number) {
  return Math.max(0, Math.min(1, (elo - 1560) / 600));
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
  const n = () => rand(-0.08, 0.08);
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

// ---- Real recent form (most-recent first) ---------------------------------
// Sourced from ESPN/Wikipedia results pages (2025–June 2026). venue: H/A/N.
interface RealMatch {
  d: string;
  o: string;
  v: "H" | "A" | "N";
  gf: number;
  ga: number;
  c: string;
}
const REAL_FORM: Record<string, RealMatch[]> = {
  Argentina: [
    { d: "2026-06-09", o: "Iceland", v: "N", gf: 3, ga: 0, c: "Friendly" },
    { d: "2026-06-06", o: "Honduras", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Zambia", v: "H", gf: 5, ga: 0, c: "Friendly" },
    { d: "2026-03-27", o: "Mauritania", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-11-14", o: "Angola", v: "A", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Puerto Rico", v: "N", gf: 6, ga: 0, c: "Friendly" },
    { d: "2025-10-10", o: "Venezuela", v: "N", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Ecuador", v: "A", gf: 0, ga: 1, c: "WCQ" },
    { d: "2025-09-04", o: "Venezuela", v: "H", gf: 3, ga: 0, c: "WCQ" },
    { d: "2025-06-10", o: "Colombia", v: "A", gf: 1, ga: 1, c: "WCQ" },
  ],
  France: [
    { d: "2026-06-08", o: "Northern Ireland", v: "H", gf: 3, ga: 1, c: "Friendly" },
    { d: "2026-06-04", o: "Ivory Coast", v: "H", gf: 1, ga: 2, c: "Friendly" },
    { d: "2026-03-29", o: "Colombia", v: "N", gf: 3, ga: 1, c: "Friendly" },
    { d: "2026-03-26", o: "Brazil", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-11-16", o: "Azerbaijan", v: "H", gf: 3, ga: 1, c: "WCQ" },
    { d: "2025-11-13", o: "Ukraine", v: "A", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-10-13", o: "Iceland", v: "A", gf: 2, ga: 2, c: "WCQ" },
    { d: "2025-10-10", o: "Azerbaijan", v: "H", gf: 3, ga: 0, c: "WCQ" },
    { d: "2025-09-09", o: "Iceland", v: "A", gf: 2, ga: 1, c: "WCQ" },
    { d: "2025-09-05", o: "Ukraine", v: "A", gf: 2, ga: 0, c: "WCQ" },
  ],
  Spain: [
    { d: "2026-06-08", o: "Peru", v: "N", gf: 1, ga: 3, c: "Friendly" },
    { d: "2026-06-04", o: "Iraq", v: "H", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "Egypt", v: "H", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-03-27", o: "Serbia", v: "H", gf: 3, ga: 0, c: "Friendly" },
    { d: "2025-11-18", o: "Türkiye", v: "A", gf: 2, ga: 2, c: "WCQ" },
    { d: "2025-11-15", o: "Georgia", v: "H", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-10-14", o: "Bulgaria", v: "A", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-10-11", o: "Georgia", v: "H", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-09-07", o: "Türkiye", v: "A", gf: 6, ga: 0, c: "WCQ" },
    { d: "2025-09-04", o: "Bulgaria", v: "A", gf: 3, ga: 0, c: "WCQ" },
  ],
  England: [
    { d: "2026-06-10", o: "Costa Rica", v: "N", gf: 3, ga: 0, c: "Friendly" },
    { d: "2026-06-06", o: "New Zealand", v: "N", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Japan", v: "A", gf: 0, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Uruguay", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-11-16", o: "Albania", v: "H", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-11-13", o: "Serbia", v: "A", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-10-14", o: "Latvia", v: "A", gf: 5, ga: 0, c: "WCQ" },
    { d: "2025-10-09", o: "Wales", v: "H", gf: 3, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Serbia", v: "H", gf: 5, ga: 0, c: "WCQ" },
    { d: "2025-09-06", o: "Andorra", v: "H", gf: 2, ga: 0, c: "WCQ" },
  ],
  Brazil: [
    { d: "2026-06-06", o: "Egypt", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-05-31", o: "Panama", v: "N", gf: 6, ga: 2, c: "Friendly" },
    { d: "2026-03-31", o: "Croatia", v: "N", gf: 3, ga: 1, c: "Friendly" },
    { d: "2026-03-26", o: "France", v: "N", gf: 1, ga: 2, c: "Friendly" },
    { d: "2025-11-18", o: "Tunisia", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-11-15", o: "Senegal", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Japan", v: "A", gf: 2, ga: 3, c: "Friendly" },
    { d: "2025-10-10", o: "South Korea", v: "A", gf: 5, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Bolivia", v: "A", gf: 0, ga: 1, c: "WCQ" },
    { d: "2025-09-04", o: "Chile", v: "H", gf: 3, ga: 0, c: "WCQ" },
  ],
  Portugal: [
    { d: "2026-06-10", o: "Nigeria", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-06-06", o: "Chile", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "USA", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-03-28", o: "Mexico", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-11-16", o: "Armenia", v: "H", gf: 9, ga: 1, c: "WCQ" },
    { d: "2025-11-13", o: "Ireland", v: "A", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-10-14", o: "Hungary", v: "A", gf: 2, ga: 2, c: "WCQ" },
    { d: "2025-10-11", o: "Ireland", v: "H", gf: 1, ga: 0, c: "WCQ" },
    { d: "2025-09-09", o: "Hungary", v: "H", gf: 3, ga: 2, c: "WCQ" },
    { d: "2025-09-06", o: "Armenia", v: "H", gf: 5, ga: 0, c: "WCQ" },
  ],
  Netherlands: [
    { d: "2026-06-08", o: "Uzbekistan", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-06-03", o: "Algeria", v: "N", gf: 0, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "Ecuador", v: "H", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Norway", v: "A", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-11-17", o: "Lithuania", v: "H", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-11-14", o: "Poland", v: "A", gf: 1, ga: 1, c: "WCQ" },
    { d: "2025-10-12", o: "Finland", v: "A", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-10-09", o: "Malta", v: "H", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-09-07", o: "Lithuania", v: "A", gf: 3, ga: 2, c: "WCQ" },
    { d: "2025-09-04", o: "Poland", v: "H", gf: 1, ga: 1, c: "WCQ" },
  ],
  Belgium: [
    { d: "2026-06-06", o: "Tunisia", v: "H", gf: 5, ga: 0, c: "Friendly" },
    { d: "2026-06-02", o: "Croatia", v: "H", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Mexico", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-03-28", o: "USA", v: "N", gf: 5, ga: 2, c: "Friendly" },
    { d: "2025-11-18", o: "Liechtenstein", v: "A", gf: 7, ga: 0, c: "WCQ" },
    { d: "2025-11-15", o: "Kazakhstan", v: "H", gf: 1, ga: 1, c: "WCQ" },
    { d: "2025-10-13", o: "Wales", v: "H", gf: 4, ga: 2, c: "WCQ" },
    { d: "2025-10-10", o: "North Macedonia", v: "A", gf: 0, ga: 0, c: "WCQ" },
    { d: "2025-09-07", o: "Kazakhstan", v: "A", gf: 6, ga: 0, c: "WCQ" },
    { d: "2025-09-04", o: "Liechtenstein", v: "H", gf: 6, ga: 0, c: "WCQ" },
  ],
  Germany: [
    { d: "2026-06-06", o: "USA", v: "A", gf: 1, ga: 2, c: "Friendly" },
    { d: "2026-05-31", o: "Finland", v: "H", gf: 4, ga: 0, c: "Friendly" },
    { d: "2026-03-30", o: "Ghana", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Switzerland", v: "A", gf: 4, ga: 3, c: "Friendly" },
    { d: "2025-11-17", o: "Slovakia", v: "H", gf: 6, ga: 0, c: "WCQ" },
    { d: "2025-11-14", o: "Luxembourg", v: "A", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-10-13", o: "Northern Ireland", v: "A", gf: 1, ga: 0, c: "WCQ" },
    { d: "2025-10-10", o: "Luxembourg", v: "H", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-09-07", o: "Northern Ireland", v: "H", gf: 3, ga: 1, c: "WCQ" },
    { d: "2025-09-04", o: "Slovakia", v: "A", gf: 0, ga: 2, c: "WCQ" },
  ],
  Croatia: [
    { d: "2026-06-07", o: "Slovenia", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-06-02", o: "Belgium", v: "A", gf: 0, ga: 2, c: "Friendly" },
    { d: "2026-03-31", o: "Brazil", v: "N", gf: 1, ga: 3, c: "Friendly" },
    { d: "2026-03-26", o: "Colombia", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-11-17", o: "Montenegro", v: "A", gf: 3, ga: 2, c: "WCQ" },
    { d: "2025-11-14", o: "Faroe Islands", v: "H", gf: 3, ga: 1, c: "WCQ" },
    { d: "2025-10-12", o: "Gibraltar", v: "H", gf: 3, ga: 0, c: "WCQ" },
    { d: "2025-10-09", o: "Czechia", v: "A", gf: 0, ga: 0, c: "WCQ" },
    { d: "2025-09-08", o: "Montenegro", v: "H", gf: 4, ga: 0, c: "WCQ" },
    { d: "2025-09-05", o: "Faroe Islands", v: "A", gf: 1, ga: 0, c: "WCQ" },
  ],
  Uruguay: [
    { d: "2026-03-31", o: "Algeria", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-03-27", o: "England", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-11-18", o: "USA", v: "N", gf: 5, ga: 1, c: "Friendly" },
    { d: "2025-11-15", o: "Mexico", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-10-13", o: "Uzbekistan", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-10-10", o: "Dominican Rep.", v: "N", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Chile", v: "H", gf: 0, ga: 0, c: "WCQ" },
    { d: "2025-09-04", o: "Peru", v: "A", gf: 3, ga: 0, c: "WCQ" },
    { d: "2025-06-10", o: "Venezuela", v: "A", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-06-05", o: "Paraguay", v: "H", gf: 2, ga: 0, c: "WCQ" },
  ],
  Morocco: [
    { d: "2026-06-07", o: "Norway", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-06-02", o: "Madagascar", v: "N", gf: 4, ga: 0, c: "Friendly" },
    { d: "2026-05-26", o: "Burundi", v: "N", gf: 5, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Paraguay", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Ecuador", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-01-18", o: "Senegal", v: "H", gf: 3, ga: 0, c: "AFCON Final" },
    { d: "2026-01-14", o: "Nigeria", v: "H", gf: 0, ga: 0, c: "AFCON" },
    { d: "2026-01-09", o: "Cameroon", v: "H", gf: 2, ga: 0, c: "AFCON" },
    { d: "2026-01-04", o: "Tanzania", v: "H", gf: 1, ga: 0, c: "AFCON" },
    { d: "2025-12-29", o: "Zambia", v: "H", gf: 3, ga: 0, c: "AFCON" },
  ],
  Colombia: [
    { d: "2026-06-07", o: "Jordan", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-06-01", o: "Costa Rica", v: "N", gf: 3, ga: 1, c: "Friendly" },
    { d: "2026-03-29", o: "France", v: "N", gf: 1, ga: 3, c: "Friendly" },
    { d: "2026-03-26", o: "Croatia", v: "N", gf: 1, ga: 2, c: "Friendly" },
    { d: "2025-11-18", o: "Australia", v: "H", gf: 3, ga: 0, c: "Friendly" },
    { d: "2025-11-15", o: "New Zealand", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-10-14", o: "Canada", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-10-11", o: "Mexico", v: "A", gf: 4, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Venezuela", v: "H", gf: 6, ga: 3, c: "WCQ" },
    { d: "2025-09-04", o: "Bolivia", v: "H", gf: 3, ga: 0, c: "WCQ" },
  ],
  USA: [
    { d: "2026-06-06", o: "Germany", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-05-31", o: "Senegal", v: "H", gf: 3, ga: 2, c: "Friendly" },
    { d: "2026-03-31", o: "Portugal", v: "N", gf: 0, ga: 2, c: "Friendly" },
    { d: "2026-03-28", o: "Belgium", v: "N", gf: 2, ga: 5, c: "Friendly" },
    { d: "2025-11-18", o: "Uruguay", v: "N", gf: 1, ga: 5, c: "Friendly" },
    { d: "2025-11-15", o: "Paraguay", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-10-14", o: "Australia", v: "H", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-10-10", o: "Ecuador", v: "A", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-09-09", o: "Japan", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-09-06", o: "South Korea", v: "A", gf: 0, ga: 2, c: "Friendly" },
  ],
  Mexico: [
    { d: "2026-06-04", o: "Serbia", v: "N", gf: 5, ga: 1, c: "Friendly" },
    { d: "2026-05-30", o: "Australia", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-05-22", o: "Ghana", v: "H", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Belgium", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-03-28", o: "Portugal", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-02-25", o: "Iceland", v: "H", gf: 4, ga: 0, c: "Friendly" },
    { d: "2026-01-25", o: "Bolivia", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-01-22", o: "Panama", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-11-18", o: "Paraguay", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2025-11-15", o: "Uruguay", v: "N", gf: 0, ga: 0, c: "Friendly" },
  ],
  Canada: [
    { d: "2026-06-05", o: "Ireland", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-06-01", o: "Uzbekistan", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Tunisia", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-03-28", o: "Iceland", v: "N", gf: 2, ga: 2, c: "Friendly" },
    { d: "2026-01-17", o: "Guatemala", v: "N", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-11-18", o: "Venezuela", v: "H", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-11-13", o: "Ecuador", v: "A", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Colombia", v: "A", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-10-10", o: "Australia", v: "A", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "Wales", v: "A", gf: 1, ga: 0, c: "Friendly" },
  ],
  Japan: [
    { d: "2026-05-31", o: "Iceland", v: "A", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "England", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-03-28", o: "Scotland", v: "A", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-11-18", o: "Bolivia", v: "A", gf: 3, ga: 0, c: "Friendly" },
    { d: "2025-11-14", o: "Ghana", v: "A", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Brazil", v: "H", gf: 3, ga: 2, c: "Friendly" },
    { d: "2025-10-10", o: "Paraguay", v: "H", gf: 2, ga: 2, c: "Friendly" },
    { d: "2025-09-09", o: "USA", v: "N", gf: 0, ga: 2, c: "Friendly" },
    { d: "2025-09-06", o: "Mexico", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-06-10", o: "Indonesia", v: "A", gf: 6, ga: 0, c: "WCQ" },
  ],
  "South Korea": [
    { d: "2026-06-03", o: "El Salvador", v: "N", gf: 1, ga: 0, c: "Friendly" },
    { d: "2026-05-30", o: "Trinidad & Tobago", v: "N", gf: 5, ga: 0, c: "Friendly" },
    { d: "2026-03-31", o: "Austria", v: "N", gf: 0, ga: 1, c: "Friendly" },
    { d: "2026-03-28", o: "Ivory Coast", v: "N", gf: 0, ga: 4, c: "Friendly" },
    { d: "2025-11-18", o: "Ghana", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-11-14", o: "Bolivia", v: "H", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Paraguay", v: "H", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-10-10", o: "Brazil", v: "H", gf: 0, ga: 5, c: "Friendly" },
    { d: "2025-09-09", o: "Mexico", v: "N", gf: 2, ga: 2, c: "Friendly" },
    { d: "2025-09-06", o: "USA", v: "H", gf: 2, ga: 0, c: "Friendly" },
  ],
  Senegal: [
    { d: "2026-06-09", o: "Saudi Arabia", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-05-31", o: "USA", v: "A", gf: 2, ga: 3, c: "Friendly" },
    { d: "2026-03-31", o: "Gambia", v: "N", gf: 1, ga: 3, c: "Friendly" },
    { d: "2026-03-28", o: "Peru", v: "N", gf: 0, ga: 2, c: "Friendly" },
    { d: "2026-01-18", o: "Morocco", v: "A", gf: 0, ga: 3, c: "AFCON Final" },
    { d: "2026-01-14", o: "Egypt", v: "N", gf: 0, ga: 1, c: "AFCON" },
    { d: "2026-01-09", o: "Mali", v: "H", gf: 1, ga: 0, c: "AFCON" },
    { d: "2026-01-03", o: "Sudan", v: "H", gf: 3, ga: 1, c: "AFCON" },
    { d: "2025-12-30", o: "Benin", v: "H", gf: 3, ga: 0, c: "AFCON" },
    { d: "2025-11-18", o: "Kenya", v: "A", gf: 8, ga: 0, c: "Friendly" },
  ],
  Switzerland: [
    { d: "2026-06-06", o: "Australia", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-05-31", o: "Jordan", v: "N", gf: 4, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "Norway", v: "N", gf: 0, ga: 0, c: "Friendly" },
    { d: "2026-03-27", o: "Germany", v: "H", gf: 3, ga: 4, c: "Friendly" },
    { d: "2025-11-18", o: "Kosovo", v: "H", gf: 1, ga: 1, c: "WCQ" },
    { d: "2025-11-15", o: "Sweden", v: "A", gf: 4, ga: 1, c: "WCQ" },
    { d: "2025-10-13", o: "Slovenia", v: "H", gf: 0, ga: 0, c: "WCQ" },
    { d: "2025-10-10", o: "Sweden", v: "H", gf: 2, ga: 0, c: "WCQ" },
    { d: "2025-09-08", o: "Slovenia", v: "A", gf: 3, ga: 0, c: "WCQ" },
    { d: "2025-09-05", o: "Kosovo", v: "A", gf: 4, ga: 0, c: "WCQ" },
  ],
  Ecuador: [
    { d: "2026-06-07", o: "Guatemala", v: "H", gf: 3, ga: 0, c: "Friendly" },
    { d: "2026-05-30", o: "Saudi Arabia", v: "N", gf: 2, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "Netherlands", v: "A", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Morocco", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-11-18", o: "New Zealand", v: "N", gf: 2, ga: 0, c: "Friendly" },
    { d: "2025-11-13", o: "Canada", v: "H", gf: 0, ga: 0, c: "Friendly" },
    { d: "2025-10-14", o: "Mexico", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-10-10", o: "USA", v: "H", gf: 1, ga: 1, c: "Friendly" },
    { d: "2025-09-09", o: "Argentina", v: "H", gf: 1, ga: 0, c: "WCQ" },
    { d: "2025-09-04", o: "Paraguay", v: "H", gf: 0, ga: 0, c: "WCQ" },
  ],
  Australia: [
    { d: "2026-06-06", o: "Switzerland", v: "N", gf: 1, ga: 1, c: "Friendly" },
    { d: "2026-05-30", o: "Mexico", v: "A", gf: 0, ga: 1, c: "Friendly" },
    { d: "2026-03-31", o: "Curaçao", v: "H", gf: 5, ga: 1, c: "Friendly" },
    { d: "2026-03-27", o: "Cameroon", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-11-18", o: "Colombia", v: "A", gf: 0, ga: 3, c: "Friendly" },
    { d: "2025-11-14", o: "Venezuela", v: "A", gf: 0, ga: 1, c: "Friendly" },
    { d: "2025-10-14", o: "USA", v: "A", gf: 1, ga: 2, c: "Friendly" },
    { d: "2025-10-10", o: "Canada", v: "H", gf: 1, ga: 0, c: "Friendly" },
    { d: "2025-09-09", o: "New Zealand", v: "A", gf: 3, ga: 1, c: "Friendly" },
    { d: "2025-09-05", o: "New Zealand", v: "H", gf: 0, ga: 1, c: "Friendly" },
  ],
};

// ---- Date helpers (for synthetic rows) ------------------------------------
const BASE = Date.UTC(2026, 5, 1); // 2026-06-01
const DAY = 86400000;
const isoDaysAgo = (days: number) => new Date(BASE - days * DAY).toISOString().slice(0, 10);

function sampleScore(attA: number, defB: number, attB: number, defA: number) {
  const lamA = Math.max(0.2, (attA + defB) / 2);
  const lamB = Math.max(0.2, (attB + defA) / 2);
  const draw = (lam: number) => {
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

    const teams = ROSTER.map((t) => {
      const stats = statsFor(t.elo);
      const info = insertTeam.run({ name: t.name, code: t.code, group: t.group, elo: t.elo, ...stats });
      return { id: Number(info.lastInsertRowid), ...t, stats };
    });

    // Recent form: real where available, synthetic otherwise.
    const insertRecent = db.prepare(
      `INSERT INTO recent_matches (team_id, opponent, is_home, goals_for, goals_against, result, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const team of teams) {
      const real = REAL_FORM[team.name];
      if (real && real.length > 0) {
        for (const m of real) {
          const result = m.gf > m.ga ? "W" : m.gf < m.ga ? "L" : "D";
          insertRecent.run(team.id, m.o, m.v === "H" ? 1 : 0, m.gf, m.ga, result, m.d);
        }
      } else {
        for (let i = 0; i < 10; i++) {
          const opp = teams[randInt(0, teams.length - 1)];
          const oppT = opp.id === team.id ? teams[(teams.indexOf(opp) + 1) % teams.length] : opp;
          const isHome = rng() > 0.5;
          const score = sampleScore(
            team.stats.avgGoalsScored,
            oppT.stats.avgGoalsConceded,
            oppT.stats.avgGoalsScored,
            team.stats.avgGoalsConceded,
          );
          const result = score.a > score.b ? "W" : score.a < score.b ? "L" : "D";
          insertRecent.run(team.id, oppT.name, isHome ? 1 : 0, score.a, score.b, result, isoDaysAgo(i * 7 + 3));
        }
      }
    }

    // Head-to-head: synthetic, deterministic, for every pair.
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

    return teams.length;
  });

  const n = tx();
  return { seeded: true, teams: n };
}

const isDirectRun = process.argv[1] && process.argv[1].includes("seed");
if (isDirectRun) {
  const result = seed(true);
  // eslint-disable-next-line no-console
  console.log(`Seeded database: ${result.teams} teams.`);
}
