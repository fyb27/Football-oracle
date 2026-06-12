import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { history, type HistoryEntry } from "../lib/storage";
import { riskEmoji, formatDate } from "../lib/format";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>(history.all());
  const navigate = useNavigate();

  function remove(id: string) {
    history.remove(id);
    setEntries(history.all());
  }
  function clearAll() {
    history.clear();
    setEntries([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Prediction History</h1>
          <p className="mt-1 text-slate-400">Your saved analyses, kept locally on this device.</p>
        </div>
        {entries.length > 0 && (
          <button className="btn-ghost" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No saved predictions yet"
          body="Run an analysis on the Predict page and it’ll show up here automatically."
          cta={() => navigate("/")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries.map((e, i) => {
            const top = Math.max(e.outcome.homeWin, e.outcome.draw, e.outcome.awayWin);
            const pick =
              top === e.outcome.homeWin
                ? `${e.homeName} win`
                : top === e.outcome.awayWin
                  ? `${e.awayName} win`
                  : "Draw";
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass flex flex-col gap-3 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">
                      {e.homeName} <span className="text-slate-500">vs</span> {e.awayName}
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(e.savedAt)}</div>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/10 hover:text-oracle-loss"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="chip">{pick}</span>
                  <span className="chip">Conf {e.confidence}%</span>
                  <span className="chip">{riskEmoji(e.risk as "Low" | "Medium" | "High")} {e.risk}</span>
                  <span className="chip">Score {e.topScore}</span>
                </div>
                <button className="btn-ghost mt-1 self-start" onClick={() => navigate(`/?home=${e.homeId}&away=${e.awayId}`)}>
                  Re-run analysis →
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta: () => void }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-12 text-center">
      <span className="text-4xl">📉</span>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="max-w-sm text-sm text-slate-400">{body}</p>
      <button className="btn-primary mt-2" onClick={cta}>
        Make a prediction
      </button>
    </div>
  );
}
