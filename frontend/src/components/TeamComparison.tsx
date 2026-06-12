import { motion } from "framer-motion";
import type { MatchAnalysis, TeamSummary } from "../types";
import TeamBadge from "./TeamBadge";

interface Metric {
  label: string;
  home: number;
  away: number;
  format: (n: number) => string;
  higherIsBetter: boolean;
}

function buildMetrics(home: TeamSummary, away: TeamSummary): Metric[] {
  const pctFmt = (n: number) => `${Math.round(n * 100)}%`;
  const dec = (n: number) => n.toFixed(2);
  const one = (n: number) => n.toFixed(1);
  const winsIn10 = (t: TeamSummary) => t.form.filter((r) => r === "W").length;
  return [
    { label: "Recent Form (W/10)", home: winsIn10(home), away: winsIn10(away), format: (n) => `${n}`, higherIsBetter: true },
    { label: "Win Rate", home: home.stats.winRate, away: away.stats.winRate, format: pctFmt, higherIsBetter: true },
    { label: "Goals Scored", home: home.stats.avgGoalsScored, away: away.stats.avgGoalsScored, format: dec, higherIsBetter: true },
    { label: "Goals Conceded", home: home.stats.avgGoalsConceded, away: away.stats.avgGoalsConceded, format: dec, higherIsBetter: false },
    { label: "Expected Goals (xG)", home: home.stats.xgFor, away: away.stats.xgFor, format: dec, higherIsBetter: true },
    { label: "Expected Goals Against", home: home.stats.xgAgainst, away: away.stats.xgAgainst, format: dec, higherIsBetter: false },
    { label: "Clean Sheets", home: home.stats.cleanSheetRate, away: away.stats.cleanSheetRate, format: pctFmt, higherIsBetter: true },
    { label: "Possession", home: home.stats.possession, away: away.stats.possession, format: pctFmt, higherIsBetter: true },
    { label: "Shots / Match", home: home.stats.shotsPerMatch, away: away.stats.shotsPerMatch, format: one, higherIsBetter: true },
    { label: "Pass Accuracy", home: home.stats.passAccuracy, away: away.stats.passAccuracy, format: pctFmt, higherIsBetter: true },
  ];
}

export default function TeamComparison({ analysis }: { analysis: MatchAnalysis }) {
  const { home, away } = analysis;
  const metrics = buildMetrics(home, away);

  return (
    <div className="glass p-5">
      <div className="mb-4 grid grid-cols-3 items-center">
        <div className="flex items-center gap-2">
          <TeamBadge code={home.code} size={32} />
          <span className="hidden font-semibold text-white sm:inline">{home.name}</span>
        </div>
        <h3 className="text-center text-lg font-bold text-white">Comparison</h3>
        <div className="flex items-center justify-end gap-2">
          <span className="hidden font-semibold text-white sm:inline">{away.name}</span>
          <TeamBadge code={away.code} size={32} />
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((m, i) => {
          const total = m.home + m.away || 1;
          const homeShare = (m.home / total) * 100;
          const homeBetter = m.higherIsBetter ? m.home > m.away : m.home < m.away;
          const tie = m.home === m.away;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="mb-1 grid grid-cols-3 text-sm">
                <span className={`font-semibold tabular-nums ${!tie && homeBetter ? "text-oracle-win" : "text-slate-300"}`}>
                  {m.format(m.home)}
                </span>
                <span className="text-center text-xs text-slate-400">{m.label}</span>
                <span className={`text-right font-semibold tabular-nums ${!tie && !homeBetter ? "text-oracle-win" : "text-slate-300"}`}>
                  {m.format(m.away)}
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-oracle-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${homeShare}%` }}
                  transition={{ delay: 0.1 + i * 0.03, duration: 0.5 }}
                />
                <div className="h-full flex-1 bg-oracle-loss/70" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
