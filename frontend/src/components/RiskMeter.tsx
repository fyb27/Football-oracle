import { motion } from "framer-motion";
import type { MatchAnalysis } from "../types";
import { riskColor, riskEmoji } from "../lib/format";

export default function RiskMeter({ risk }: { risk: MatchAnalysis["risk"] }) {
  const color = riskColor(risk.level);
  const factors = [
    { label: "Strength gap", value: risk.factors.strengthGap },
    { label: "Model agreement", value: risk.factors.modelAgreement },
    { label: "Historical predictability", value: risk.factors.historicalPredictability },
    { label: "Form consistency", value: risk.factors.formConsistency },
  ];

  return (
    <div className="glass flex flex-col p-5">
      <div className="section-title">Risk Level</div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-2xl">{riskEmoji(risk.level)}</span>
        <span className="text-2xl font-black" style={{ color }}>
          {risk.level} Risk
        </span>
      </div>

      {/* Risk gauge */}
      <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-oracle-win via-oracle-draw to-oracle-loss">
        <motion.div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-ink-900 shadow-lg"
          initial={{ left: "0%" }}
          animate={{ left: `calc(${risk.score}% - 10px)` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>Predictable</span>
        <span>Risk score {risk.score}</span>
        <span>Volatile</span>
      </div>

      {/* Contributing factors (higher = more predictable) */}
      <div className="mt-4 space-y-2">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-xs">
            <span className="w-40 shrink-0 text-slate-400">{f.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-oracle-accent"
                initial={{ width: 0 }}
                animate={{ width: `${f.value}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-slate-300">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
