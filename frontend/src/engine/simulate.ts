import type { MatchDataProvider, Team } from "./dataTypes";
import { predict } from "./prediction";
import { poissonModel } from "./poisson";

/**
 * Monte Carlo World Cup simulator.
 *
 * 1. Precompute a neutral-venue match model (goal rates + outcome odds) for
 *    every pair of teams once.
 * 2. Simulate the whole tournament N times: 12 groups → Round of 32 (top 2 of
 *    each group + 8 best third-placed) → single-elimination to the final.
 * 3. Aggregate into per-team probabilities (advance / reach each round / win)
 *    and per-group projected standings.
 * 4. Separately, derive one deterministic "expected" bracket from the model
 *    (favourite advances each tie) for a clean projected knockout view.
 *
 * Knockout seeding is by tournament performance + team strength — a pragmatic
 * approximation of FIFA's exact R32 bracket table, which keeps title odds sane.
 */

export interface PairModel {
  la: number; // expected goals, team A
  lb: number; // expected goals, team B
  pA: number; // P(A wins) incl. nothing for draws
  pDraw: number;
  pB: number;
}

export interface TeamOdds {
  id: number;
  name: string;
  code: string;
  group: string;
  elo: number;
  winGroup: number; // 0..1
  advance: number; // reach R32 (qualify from group)
  r16: number;
  quarter: number;
  semi: number;
  finalist: number;
  champion: number;
  meanPoints: number;
}

export interface GroupStanding {
  id: number;
  name: string;
  code: string;
  advance: number;
  winGroup: number;
  meanPoints: number;
}

export interface BracketTeam {
  name: string;
  code: string;
}
export interface BracketMatch {
  a: BracketTeam | null;
  b: BracketTeam | null;
  winner: BracketTeam | null;
}
export interface ProjectedBracket {
  r32: BracketMatch[];
  r16: BracketMatch[];
  qf: BracketMatch[];
  sf: BracketMatch[];
  final: BracketMatch[];
  champion: BracketTeam | null;
}

export interface SimResult {
  sims: number;
  teams: TeamOdds[]; // sorted by champion desc
  groups: Record<string, GroupStanding[]>; // each sorted by advance desc
  bracket: ProjectedBracket;
}

// ---- model ----------------------------------------------------------------
type Model = Map<number, Map<number, PairModel>>;

function buildModel(provider: MatchDataProvider, teams: Team[]): Model {
  const forms = new Map(teams.map((t) => [t.id, provider.getRecentForm(t.id)]));
  const model: Model = new Map(teams.map((t) => [t.id, new Map()]));

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i];
      const b = teams[j];
      const h2h = provider.getHeadToHead(a.id, b.id);
      const w = predict(a, b, forms.get(a.id)!, forms.get(b.id)!, h2h, { neutral: true });
      const o = poissonModel(w.lambdaHome, w.lambdaAway).outcome;
      const ab: PairModel = {
        la: w.lambdaHome,
        lb: w.lambdaAway,
        pA: o.homeWin / 100,
        pDraw: o.draw / 100,
        pB: o.awayWin / 100,
      };
      model.get(a.id)!.set(b.id, ab);
      model.get(b.id)!.set(a.id, { la: ab.lb, lb: ab.la, pA: ab.pB, pDraw: ab.pDraw, pB: ab.pA });
    }
  }
  return model;
}

const pair = (model: Model, a: number, b: number) => model.get(a)!.get(b)!;

// ---- sampling -------------------------------------------------------------
function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Standard single-elimination seed order (1 meets last, etc.).
function seedOrder(n: number): number[] {
  let pots = [1, 2];
  while (pots.length < n) {
    const len = pots.length * 2 + 1;
    const next: number[] = [];
    for (const p of pots) {
      next.push(p);
      next.push(len - p);
    }
    pots = next;
  }
  return pots;
}

interface GroupRow {
  id: number;
  pts: number;
  gd: number;
  gf: number;
}

// ---- main simulation ------------------------------------------------------
export function simulateTournament(
  provider: MatchDataProvider,
  groupsByName: Record<string, string[]>,
  nSims = 10000,
): SimResult {
  const teams = provider.listTeams();
  const byName = new Map(teams.map((t) => [t.name, t]));
  const model = buildModel(provider, teams);

  // Resolve group name lists to team objects.
  const groupKeys = Object.keys(groupsByName).sort();
  const groups: Record<string, Team[]> = {};
  for (const k of groupKeys) groups[k] = groupsByName[k].map((n) => byName.get(n)!).filter(Boolean);

  // Accumulators.
  const acc = new Map<number, {
    winGroup: number; advance: number; r16: number; quarter: number;
    semi: number; finalist: number; champion: number; points: number;
  }>();
  for (const t of teams)
    acc.set(t.id, { winGroup: 0, advance: 0, r16: 0, quarter: 0, semi: 0, finalist: 0, champion: 0, points: 0 });

  const order32 = seedOrder(32); // 32 bracket positions

  for (let s = 0; s < nSims; s++) {
    const qualifiers: number[] = []; // direct top-2, in seed-priority order later
    const winners: GroupRow[] = [];
    const runners: GroupRow[] = [];
    const thirds: GroupRow[] = [];

    for (const k of groupKeys) {
      const g = groups[k];
      const rows: GroupRow[] = g.map((t) => ({ id: t.id, pts: 0, gd: 0, gf: 0 }));
      // round robin
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          const m = pair(model, g[i].id, g[j].id);
          const ga = samplePoisson(m.la);
          const gb = samplePoisson(m.lb);
          rows[i].gf += ga; rows[i].gd += ga - gb;
          rows[j].gf += gb; rows[j].gd += gb - ga;
          if (ga > gb) rows[i].pts += 3;
          else if (gb > ga) rows[j].pts += 3;
          else { rows[i].pts += 1; rows[j].pts += 1; }
        }
      }
      rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5);
      for (const r of rows) acc.get(r.id)!.points += r.pts;
      acc.get(rows[0].id)!.winGroup += 1;
      winners.push(rows[0]);
      runners.push(rows[1]);
      thirds.push(rows[2]);
    }

    // best 8 third-placed
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5);
    const bestThirds = thirds.slice(0, 8);

    // Seed the 32 by tier (winner > runner > third) then performance.
    winners.sort(rank); runners.sort(rank); bestThirds.sort(rank);
    const seeds = [...winners, ...runners, ...bestThirds].map((r) => r.id);
    for (const id of seeds) {
      acc.get(id)!.advance += 1;
      qualifiers.push(id);
    }

    // Place into bracket positions.
    let alive: number[] = order32.map((seed) => seeds[seed - 1]);

    // Round of 32 -> ... -> Final
    const advanceRound = (teamsIn: number[]): number[] => {
      const out: number[] = [];
      for (let i = 0; i < teamsIn.length; i += 2) {
        out.push(knockout(model, teamsIn[i], teamsIn[i + 1]));
      }
      return out;
    };

    alive = advanceRound(alive); // -> 16 (R16)
    for (const id of alive) acc.get(id)!.r16 += 1;
    alive = advanceRound(alive); // -> 8 (QF)
    for (const id of alive) acc.get(id)!.quarter += 1;
    alive = advanceRound(alive); // -> 4 (SF)
    for (const id of alive) acc.get(id)!.semi += 1;
    alive = advanceRound(alive); // -> 2 (Final)
    for (const id of alive) acc.get(id)!.finalist += 1;
    alive = advanceRound(alive); // -> 1 (Champion)
    acc.get(alive[0])!.champion += 1;
  }

  // Build outputs.
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const teamOdds: TeamOdds[] = teams.map((t) => {
    const a = acc.get(t.id)!;
    return {
      id: t.id, name: t.name, code: t.code, group: t.group, elo: t.elo,
      winGroup: a.winGroup / nSims,
      advance: a.advance / nSims,
      r16: a.r16 / nSims,
      quarter: a.quarter / nSims,
      semi: a.semi / nSims,
      finalist: a.finalist / nSims,
      champion: a.champion / nSims,
      meanPoints: a.points / nSims,
    };
  });
  teamOdds.sort((x, y) => y.champion - x.champion || y.advance - x.advance);

  const groupStandings: Record<string, GroupStanding[]> = {};
  for (const k of groupKeys) {
    groupStandings[k] = groups[k]
      .map((t) => {
        const a = acc.get(t.id)!;
        return { id: t.id, name: t.name, code: t.code, advance: a.advance / nSims, winGroup: a.winGroup / nSims, meanPoints: a.points / nSims };
      })
      .sort((x, y) => y.advance - x.advance || y.meanPoints - x.meanPoints);
  }

  const bracket = projectBracket(model, teamMap, groups, groupKeys, order32);

  return { sims: nSims, teams: teamOdds, groups: groupStandings, bracket };
}

function rank(a: GroupRow, b: GroupRow): number {
  return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5;
}

/** One knockout match: sample a scoreline; draws decided by weighted "pens". */
function knockout(model: Model, a: number, b: number): number {
  const m = pair(model, a, b);
  const ga = samplePoisson(m.la);
  const gb = samplePoisson(m.lb);
  if (ga > gb) return a;
  if (gb > ga) return b;
  // penalties — weight slightly by attacking strength
  return Math.random() < m.la / (m.la + m.lb) ? a : b;
}

// ---- deterministic projected bracket --------------------------------------
function projectBracket(
  model: Model,
  teamMap: Map<number, Team>,
  groups: Record<string, Team[]>,
  groupKeys: string[],
  order32: number[],
): ProjectedBracket {
  // Expected points per team from pairwise win/draw probabilities.
  const winners: GroupRow[] = [];
  const runners: GroupRow[] = [];
  const thirds: GroupRow[] = [];
  for (const k of groupKeys) {
    const g = groups[k];
    const rows: GroupRow[] = g.map((t) => ({ id: t.id, pts: 0, gd: 0, gf: 0 }));
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        const m = pair(model, g[i].id, g[j].id);
        rows[i].pts += 3 * m.pA + m.pDraw;
        rows[j].pts += 3 * m.pB + m.pDraw;
        rows[i].gd += m.la - m.lb;
        rows[j].gd += m.lb - m.la;
      }
    }
    rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
    winners.push(rows[0]); runners.push(rows[1]); thirds.push(rows[2]);
  }
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const bestThirds = thirds.slice(0, 8);
  winners.sort((a, b) => b.pts - a.pts);
  runners.sort((a, b) => b.pts - a.pts);
  bestThirds.sort((a, b) => b.pts - a.pts);
  const seeds = [...winners, ...runners, ...bestThirds].map((r) => r.id);

  const bt = (id: number | null): BracketTeam | null => {
    if (id == null) return null;
    const t = teamMap.get(id)!;
    return { name: t.name, code: t.code };
  };
  const favourite = (a: number, b: number): number => {
    const m = pair(model, a, b);
    return m.pA + 0.5 * m.pDraw >= m.pB + 0.5 * m.pDraw ? a : b;
  };

  let alive = order32.map((seed) => seeds[seed - 1]);
  const rounds: number[][] = [alive.slice()];
  while (alive.length > 1) {
    const next: number[] = [];
    for (let i = 0; i < alive.length; i += 2) next.push(favourite(alive[i], alive[i + 1]));
    rounds.push(next);
    alive = next;
  }
  // rounds[0]=32 teams, [1]=16 winners(R16), [2]=8(QF), [3]=4(SF), [4]=2(Final), [5]=1(champ)
  const matchesFrom = (teamsRound: number[], winnersRound: number[]): BracketMatch[] => {
    const out: BracketMatch[] = [];
    for (let i = 0; i < teamsRound.length; i += 2) {
      const a = bt(teamsRound[i]);
      const b = bt(teamsRound[i + 1]);
      const w = bt(winnersRound[i / 2]);
      out.push({ a, b, winner: w });
    }
    return out;
  };

  return {
    r32: matchesFrom(rounds[0], rounds[1]),
    r16: matchesFrom(rounds[1], rounds[2]),
    qf: matchesFrom(rounds[2], rounds[3]),
    sf: matchesFrom(rounds[3], rounds[4]),
    final: matchesFrom(rounds[4], rounds[5]),
    champion: bt(rounds[5][0]),
  };
}
