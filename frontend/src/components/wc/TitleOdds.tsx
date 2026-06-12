import { useState } from "react";
import { motion } from "framer-motion";
import type { TeamOdds } from "../../engine/simulate";
import TeamBadge from "../TeamBadge";

const fmt = (p: number) => {
  const v = p * 100;
  if (v >= 99.95) return "100%";
  if (v >= 10) return `${v.toFixed(0)}%`;
  if (v >= 1) return `${v.toFixed(1)}%`;
  if (v > 0) return `${v.toFixed(1)}%`;
  return "—";
};

export default function TitleOdds({ teams }: { teams: TeamOdds[] }) {
  const [showAll, setShowAll] = useState(false);
  const contenders = teams.slice(0, 10);
  const maxChampion = contenders[0]?.champion || 1;
  const tableTeams = showAll ? teams : teams.slice(0, 16);

  return (
    <div className="space-y-5">
      {/* Top contenders */}
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🏆 Title Odds</h3>
          <span className="chip text-slate-300">Monte Carlo · {teams.length} teams</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {contenders.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="w-5 text-right text-sm font-bold text-slate-500">{i + 1}</span>
              <TeamBadge code={t.code} size={30} />
              <span className="w-28 shrink-0 truncate text-sm font-semibold text-white sm:w-40">
                {t.name}
              </span>
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-oracle-accent to-oracle-accent2"
                  initial={{ width: 0 }}
                  animate={{ width: `${(t.champion / maxChampion) * 100}%` }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-sm font-black tabular-nums text-oracle-win">
                {fmt(t.champion)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[1.6rem_1fr_repeat(5,3.2rem)] gap-1 border-b border-white/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:grid-cols-[1.6rem_1fr_repeat(6,3.4rem)]">
          <span>#</span>
          <span>Team</span>
          <span className="hidden text-center sm:block">Advance</span>
          <span className="text-center">R16</span>
          <span className="text-center">QF</span>
          <span className="text-center">SF</span>
          <span className="text-center">Final</span>
          <span className="text-center text-oracle-win">Win</span>
        </div>
        <ul>
          {tableTeams.map((t, i) => (
            <li
              key={t.id}
              className="grid grid-cols-[1.6rem_1fr_repeat(5,3.2rem)] items-center gap-1 border-b border-white/5 px-4 py-2 last:border-0 sm:grid-cols-[1.6rem_1fr_repeat(6,3.4rem)]"
            >
              <span className="text-xs font-bold text-slate-500">{i + 1}</span>
              <span className="flex items-center gap-2 truncate">
                <TeamBadge code={t.code} size={22} />
                <span className="truncate text-sm text-white">{t.name}</span>
              </span>
              <span className="hidden text-center text-xs tabular-nums text-slate-300 sm:block">{fmt(t.advance)}</span>
              <span className="text-center text-xs tabular-nums text-slate-300">{fmt(t.r16)}</span>
              <span className="text-center text-xs tabular-nums text-slate-300">{fmt(t.quarter)}</span>
              <span className="text-center text-xs tabular-nums text-slate-300">{fmt(t.semi)}</span>
              <span className="text-center text-xs tabular-nums text-slate-300">{fmt(t.finalist)}</span>
              <span className="text-center text-xs font-bold tabular-nums text-oracle-win">{fmt(t.champion)}</span>
            </li>
          ))}
        </ul>
        <button
          className="w-full py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? "Show top 16" : `Show all ${teams.length} teams`}
        </button>
      </div>
    </div>
  );
}
