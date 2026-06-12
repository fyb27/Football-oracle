import type { MatchAnalysis } from "../types";

// LocalStorage-backed persistence for favorites + prediction history. Keeps the
// app fully usable offline / on GitHub Pages without a user database.

const FAVORITES_KEY = "oracle.favorites";
const HISTORY_KEY = "oracle.history";
const HISTORY_LIMIT = 50;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

// ---- Favorites (team ids) --------------------------------------------------
export const favorites = {
  all: () => read<number[]>(FAVORITES_KEY, []),
  has: (id: number) => favorites.all().includes(id),
  toggle(id: number): number[] {
    const current = favorites.all();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(FAVORITES_KEY, next);
    return next;
  },
};

// ---- Prediction history ----------------------------------------------------
export interface HistoryEntry {
  id: string;
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
  outcome: MatchAnalysis["outcome"];
  confidence: number;
  risk: string;
  topScore: string;
  savedAt: string;
  analysis: MatchAnalysis;
}

export const history = {
  all: () => read<HistoryEntry[]>(HISTORY_KEY, []),

  add(analysis: MatchAnalysis): HistoryEntry {
    const entry: HistoryEntry = {
      id: `${analysis.home.id}-${analysis.away.id}-${analysis.generatedAt}`,
      homeId: analysis.home.id,
      awayId: analysis.away.id,
      homeName: analysis.home.name,
      awayName: analysis.away.name,
      outcome: analysis.outcome,
      confidence: analysis.confidence.score,
      risk: analysis.risk.level,
      topScore: analysis.topScores[0]?.label ?? "",
      savedAt: analysis.generatedAt,
      analysis,
    };
    // De-dupe by fixture, newest first, capped.
    const existing = history.all().filter((e) => !(e.homeId === entry.homeId && e.awayId === entry.awayId));
    const next = [entry, ...existing].slice(0, HISTORY_LIMIT);
    write(HISTORY_KEY, next);
    return entry;
  },

  remove(id: string) {
    write(
      HISTORY_KEY,
      history.all().filter((e) => e.id !== id),
    );
  },

  clear() {
    write(HISTORY_KEY, []);
  },
};
