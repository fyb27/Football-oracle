/**
 * Generates a deterministic slate of "today's" fixtures for the Best
 * Predictions page. Seeded by the date string so the slate is stable across a
 * day and across server restarts, but rotates daily. Replace with a real
 * fixtures feed by swapping this function — the route only needs id pairs.
 */
export interface Fixture {
  homeId: number;
  awayId: number;
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

export function generateDailyFixtures(
  dateStr: string,
  teamIds: number[],
  count = 20,
): Fixture[] {
  const rand = mulberry32(hashSeed(dateStr));
  const seen = new Set<string>();
  const fixtures: Fixture[] = [];
  let guard = 0;
  const maxFixtures = Math.min(count, Math.floor((teamIds.length * (teamIds.length - 1)) / 2));

  while (fixtures.length < maxFixtures && guard < count * 50) {
    guard++;
    const home = teamIds[Math.floor(rand() * teamIds.length)];
    const away = teamIds[Math.floor(rand() * teamIds.length)];
    if (home === away) continue;
    const key = home < away ? `${home}-${away}` : `${away}-${home}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fixtures.push({ homeId: home, awayId: away });
  }
  return fixtures;
}
