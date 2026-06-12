import { motion } from "framer-motion";
import type { MatchAnalysis } from "../types";

export default function ConfidenceStars({
  confidence,
}: {
  confidence: MatchAnalysis["confidence"];
}) {
  return (
    <div className="glass flex flex-col justify-between p-5">
      <div className="section-title">Confidence</div>
      <div className="mt-3 flex items-center gap-1 text-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 14 }}
            className={i < confidence.stars ? "text-oracle-draw" : "text-white/15"}
          >
            ★
          </motion.span>
        ))}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black text-white tabular-nums">{confidence.score}%</span>
      </div>
      <div className="mt-1 text-sm font-medium text-slate-300">{confidence.label}</div>
    </div>
  );
}
