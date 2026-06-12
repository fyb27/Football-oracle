import { motion } from "framer-motion";
import type { Insight } from "../types";

const toneStyles: Record<Insight["tone"], string> = {
  positive: "border-oracle-win/30 bg-oracle-win/10",
  neutral: "border-white/10 bg-white/5",
  warning: "border-oracle-loss/40 bg-oracle-loss/10",
};

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-oracle-accent to-oracle-accent2 text-sm">
          ✦
        </span>
        <h3 className="text-lg font-bold text-white">AI Insights</h3>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-start gap-3 rounded-xl border p-3 ${toneStyles[insight.tone]}`}
          >
            <span className="text-xl leading-none">{insight.icon}</span>
            <span className="text-sm font-medium text-slate-100">{insight.title}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
