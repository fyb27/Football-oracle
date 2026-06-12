import type { TeamListItem, MatchAnalysis, BestMatchRow } from "../types";

// In dev, VITE_API_URL is blank and Vite proxies "/api" to the backend.
// In production, set VITE_API_URL to the deployed backend origin.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async listTeams(): Promise<TeamListItem[]> {
    const data = await request<{ teams: TeamListItem[] }>("/api/teams");
    return data.teams;
  },

  async predict(homeId: number, awayId: number): Promise<MatchAnalysis> {
    const data = await request<{ analysis: MatchAnalysis }>(
      `/api/predict?home=${homeId}&away=${awayId}`,
    );
    return data.analysis;
  },

  async bestToday(): Promise<{ date: string; matches: BestMatchRow[] }> {
    return request<{ date: string; matches: BestMatchRow[] }>("/api/best-today");
  },
};
