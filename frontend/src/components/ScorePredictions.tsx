import { motion } from "framer-motion";
import type { MatchAnalysis } from "../types";

export default function ScorePredictions({ analysis }: { analysis: MatchAnalysis }) {
  const { topScores, scoreMatrix, home, away } = analysis;
  const maxProb = Math.max(...topScores.map((s) => s.probability));
  // Heatmap intensity reference — the single most probable cell.
  const matrixMax = Math.max(...scoreMatrix.flat());

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Top 5 Likely Scores</h3>
        <span className="chip text-slate-300">Poisson model</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranked list */}
        <ol className="space-y-2.5">
          {topScores.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <span className="w-14 shrink-0 text-lg font-black tabular-nums text-white">
                {s.label}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-oracle-accent to-oracle-accent2"
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.probability / maxProb) * 100}%` }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.6 }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300">
                {s.probability.toFixed(1)}%
              </span>
            </motion.li>
          ))}
        </ol>

        {/* Heatmap */}
        <div>
          <div className="mb-2 text-center text-[11px] uppercase tracking-wider text-slate-400">
            Scoreline heatmap
          </div>
          <div className="flex">
            <div className="flex flex-col justify-center pr-1">
              <span className="rotate-180 text-center text-[10px] font-semibold text-slate-500 [writing-mode:vertical-rl]">
                {home.code} goals
              </span>
            </div>
            <div className="flex-1">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `auto repeat(${scoreMatrix[0].length}, minmax(0, 1fr))` }}
              >
                {/* top-left corner */}
                <div />
                {/* column headers (away goals) */}
                {scoreMatrix[0].map((_, a) => (
                  <div key={`col-${a}`} className="text-center text-[10px] font-semibold text-slate-500">
                    {a}
                  </div>
                ))}
                {/* rows */}
                {scoreMatrix.map((row, h) => (
                  <Row key={`row-${h}`} h={h} row={row} matrixMax={matrixMax} topLabel={topScores[0].label} />
                ))}
              </div>
              <div className="mt-1 text-center text-[10px] font-semibold text-slate-500">
                {away.code} goals →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  h,
  row,
  matrixMax,
  topLabel,
}: {
  h: number;
  row: number[];
  matrixMax: number;
  topLabel: string;
}) {
  return (
    <>
      <div className="grid place-items-center text-[10px] font-semibold text-slate-500">{h}</div>
      {row.map((p, a) => {
        const intensity = matrixMax > 0 ? p / matrixMax : 0;
        const isTop = `${h}-${a}` === topLabel;
        return (
          <motion.div
            key={`${h}-${a}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (h + a) * 0.015 }}
            title={`${h}-${a}: ${p.toFixed(1)}%`}
            className={`aspect-square rounded-md text-[9px] font-semibold ${isTop ? "ring-2 ring-white" : ""}`}
            style={{
              background: `rgba(108, 140, 255, ${0.08 + intensity * 0.85})`,
              color: intensity > 0.5 ? "#fff" : "rgba(255,255,255,0.55)",
              display: "grid",
              placeItems: "center",
            }}
          >
            {p >= 4 ? p.toFixed(0) : ""}
          </motion.div>
        );
      })}
    </>
  );
}
