import type { RiskLevel } from "../types";

export const pct = (n: number) => `${Math.round(n)}%`;

export const riskColor = (level: RiskLevel) =>
  level === "Low" ? "#22d3a7" : level === "Medium" ? "#f5c451" : "#fb6f7d";

export const riskEmoji = (level: RiskLevel) =>
  level === "Low" ? "🟢" : level === "Medium" ? "🟡" : "🔴";

export const resultColor = (r: "W" | "D" | "L") =>
  r === "W" ? "#22d3a7" : r === "D" ? "#f5c451" : "#fb6f7d";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** Cheap deterministic colour from a team code, for badge gradients. */
export function teamGradient(code: string): [string, string] {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 360;
  return [`hsl(${h}, 70%, 55%)`, `hsl(${(h + 40) % 360}, 70%, 45%)`];
}
