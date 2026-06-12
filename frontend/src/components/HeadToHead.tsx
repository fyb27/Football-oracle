import type { MatchAnalysis } from "../types";
import { formatDate } from "../lib/format";

export default function HeadToHead({ analysis }: { analysis: MatchAnalysis }) {
  const { headToHead: h, home, away } = analysis;

  if (h.meetings === 0) {
    return (
      <div className="glass p-5">
        <h3 className="mb-2 text-lg font-bold text-white">Head to Head</h3>
        <p className="text-sm text-slate-400">No recorded meetings between these teams.</p>
      </div>
    );
  }

  const stats = [
    { label: `${home.name} wins`, value: h.homeWins, color: "#22d3a7" },
    { label: "Draws", value: h.draws, color: "#f5c451" },
    { label: `${away.name} wins`, value: h.awayWins, color: "#fb6f7d" },
  ];

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Head to Head</h3>
        <span className="chip text-slate-300">{h.meetings} meetings</span>
      </div>

      {/* Win split bar */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / h.meetings) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-black tabular-nums" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[11px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <div className="text-xs text-slate-400">Goals — {home.name}</div>
          <div className="text-lg font-bold text-white">{h.homeGoals}</div>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <div className="text-xs text-slate-400">Goals — {away.name}</div>
          <div className="text-lg font-bold text-white">{h.awayGoals}</div>
        </div>
      </div>

      {h.recent.length > 0 && (
        <div className="mt-4">
          <div className="section-title mb-2">Recent results</div>
          <ul className="space-y-1.5">
            {h.recent.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="text-slate-300">
                  {m.homeTeam} <span className="font-bold text-white">{m.homeGoals}–{m.awayGoals}</span> {m.awayTeam}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {m.competition} · {formatDate(m.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
