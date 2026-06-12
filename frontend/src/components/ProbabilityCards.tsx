import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import type { MatchAnalysis } from "../types";

interface Props {
  analysis: MatchAnalysis;
}

/** The headline output: home win / draw / away win as large animated cards. */
export default function ProbabilityCards({ analysis }: Props) {
  const { home, away, outcome } = analysis;
  const cards = [
    { label: `${home.name} Win`, value: outcome.homeWin, color: "#22d3a7", key: "h" },
    { label: "Draw", value: outcome.draw, color: "#f5c451", key: "d" },
    { label: `${away.name} Win`, value: outcome.awayWin, color: "#fb6f7d", key: "a" },
  ];
  const max = Math.max(outcome.homeWin, outcome.draw, outcome.awayWin);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c, i) => {
        const isTop = c.value === max;
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: "easeOut" }}
            className={`glass relative overflow-hidden p-5 ${isTop ? "ring-1 ring-white/20" : ""}`}
            style={isTop ? { boxShadow: `0 0 38px -10px ${c.color}` } : undefined}
          >
            {isTop && (
              <span
                className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${c.color}22`, color: c.color }}
              >
                Most likely
              </span>
            )}
            <div className="text-sm font-medium text-slate-300">{c.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-5xl font-black tabular-nums" style={{ color: c.color }}>
                <Counter value={c.value} />
              </span>
              <span className="text-xl font-bold text-slate-500">%</span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: c.color }}
                initial={{ width: 0 }}
                animate={{ width: `${c.value}%` }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Counts up to the target integer for a lively reveal. */
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);
  return <>{Math.round(display)}</>;
}
