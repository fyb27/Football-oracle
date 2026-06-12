import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client";
import type { BestMatchRow } from "../types";
import { riskEmoji, formatDate } from "../lib/format";

export default function BestTodayPage() {
  const [rows, setRows] = useState<BestMatchRow[] | null>(null);
  const [date, setDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .bestToday()
      .then((d) => {
        setRows(d.matches);
        setDate(d.date);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Best Predictions Today
        </h1>
        <p className="mt-1 text-slate-400">
          Top {rows?.length ?? 20} fixtures ranked by model confidence
          {date && <span className="text-slate-500"> · {formatDate(date)}</span>}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-oracle-loss/40 bg-oracle-loss/10 p-4 text-center text-oracle-loss">
          {error}
        </div>
      )}

      {!rows && !error && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-14 animate-pulse" />
          ))}
        </div>
      )}

      {rows && (
        <div className="glass overflow-hidden">
          {/* header (desktop) */}
          <div className="hidden grid-cols-[2.5rem_1fr_10rem_6rem_6rem_6rem_7rem] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
            <span>#</span>
            <span>Match</span>
            <span>Win prediction</span>
            <span className="text-center">Confidence</span>
            <span className="text-center">Risk</span>
            <span className="text-center">xG total</span>
            <span className="text-center">Likely score</span>
          </div>

          <ul>
            {rows.map((r, i) => (
              <motion.li
                key={`${r.homeId}-${r.awayId}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.4) }}
                className="border-b border-white/5 last:border-0"
              >
                <button
                  onClick={() => navigate(`/?home=${r.homeId}&away=${r.awayId}`)}
                  className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition hover:bg-white/5 md:grid-cols-[2.5rem_1fr_10rem_6rem_6rem_6rem_7rem] md:gap-3"
                >
                  <span className="hidden text-sm font-bold text-slate-500 md:block">{i + 1}</span>
                  <span className="col-span-2 font-semibold text-white md:col-span-1">{r.match}</span>
                  <span className="text-sm text-slate-300">{r.winPrediction}</span>
                  <span className="flex items-center justify-start gap-2 md:justify-center">
                    <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-oracle-accent"
                        style={{ width: `${r.confidence}%` }}
                      />
                    </span>
                    <span className="text-sm font-bold tabular-nums text-white">{r.confidence}</span>
                  </span>
                  <span className="text-center text-sm">{riskEmoji(r.risk)} <span className="text-slate-300">{r.risk}</span></span>
                  <span className="text-center text-sm tabular-nums text-slate-300">{r.expectedGoals.toFixed(1)}</span>
                  <span className="text-center text-sm font-bold tabular-nums text-white">
                    {r.mostLikelyScore}
                    <span className="ml-1 text-xs font-normal text-slate-500">{r.mostLikelyScoreProb.toFixed(0)}%</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
