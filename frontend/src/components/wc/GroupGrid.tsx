import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { GroupStanding } from "../../engine/simulate";
import TeamBadge from "../TeamBadge";

const pct = (p: number) => {
  const v = p * 100;
  if (v >= 99.5) return "100%";
  if (v >= 10) return `${v.toFixed(0)}%`;
  return `${v.toFixed(1)}%`;
};

export default function GroupGrid({ groups }: { groups: Record<string, GroupStanding[]> }) {
  const navigate = useNavigate();
  const keys = Object.keys(groups).sort();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((k, gi) => (
        <motion.div
          key={k}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(gi * 0.04, 0.4) }}
          className="glass p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Group {k}</h4>
            <span className="text-[10px] text-slate-500">qualify %</span>
          </div>
          <ul className="space-y-1.5">
            {groups[k].map((t, i) => {
              const advancing = i < 2; // top 2 most-likely to go through
              return (
                <li
                  key={t.id}
                  onClick={() =>
                    i < groups[k].length - 1 &&
                    navigate(`/?home=${t.id}&away=${groups[k][(i + 1) % groups[k].length].id}`)
                  }
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-white/5"
                >
                  <span className={`w-3 text-center text-[11px] font-bold ${advancing ? "text-oracle-win" : "text-slate-600"}`}>
                    {i + 1}
                  </span>
                  <TeamBadge code={t.code} size={24} />
                  <span className="flex-1 truncate text-sm font-medium text-white">{t.name}</span>
                  <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${advancing ? "bg-oracle-win" : "bg-slate-500"}`}
                      style={{ width: `${Math.min(100, t.advance * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-300">
                    {pct(t.advance)}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
