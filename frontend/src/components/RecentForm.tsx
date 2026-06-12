import { motion } from "framer-motion";
import type { MatchAnalysis, MatchResult, TeamSummary } from "../types";
import { resultColor } from "../lib/format";
import TeamBadge from "./TeamBadge";

function FormRow({ team }: { team: TeamSummary }) {
  // Show oldest → newest left-to-right (form is stored newest-first).
  const form = [...team.form].reverse();
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <TeamBadge code={team.code} size={28} />
        <span className="font-semibold text-white">{team.name}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {form.map((r: MatchResult, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 18 }}
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-ink-950"
            style={{ background: resultColor(r) }}
          >
            {r}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export default function RecentForm({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="glass p-5">
      <h3 className="mb-4 text-lg font-bold text-white">Recent Form · Last 10</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormRow team={analysis.home} />
        <FormRow team={analysis.away} />
      </div>
    </div>
  );
}
