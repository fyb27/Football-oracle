import { motion } from "framer-motion";
import type { ProjectedBracket, BracketMatch, BracketTeam } from "../../engine/simulate";
import TeamBadge from "../TeamBadge";

const same = (x: BracketTeam | null, y: BracketTeam | null) => !!x && !!y && x.code === y.code && x.name === y.name;

function Side({ team, win }: { team: BracketTeam | null; win: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
        win ? "bg-oracle-win/15 ring-1 ring-oracle-win/40" : "bg-white/[0.03]"
      }`}
    >
      {team ? (
        <>
          <TeamBadge code={team.code} size={20} />
          <span className={`truncate text-xs font-medium ${win ? "text-white" : "text-slate-400"}`}>
            {team.name}
          </span>
        </>
      ) : (
        <span className="text-xs text-slate-600">—</span>
      )}
    </div>
  );
}

function Match({ m }: { m: BracketMatch }) {
  return (
    <div className="w-40 space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-1.5">
      <Side team={m.a} win={same(m.a, m.winner)} />
      <Side team={m.b} win={same(m.b, m.winner)} />
    </div>
  );
}

function Column({ title, matches }: { title: string; matches: BracketMatch[] }) {
  return (
    <div className="flex flex-col justify-around gap-3">
      <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      {matches.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
          <Match m={m} />
        </motion.div>
      ))}
    </div>
  );
}

export default function Bracket({ bracket }: { bracket: ProjectedBracket }) {
  return (
    <div className="glass p-5">
      <h3 className="mb-1 text-lg font-bold text-white">Projected Knockout</h3>
      <p className="mb-4 text-xs text-slate-400">
        Most-likely path per the model (favourite advances each tie). Seeding is approximate.
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-4">
          <Column title="Round of 16" matches={bracket.r16} />
          <Column title="Quarter-finals" matches={bracket.qf} />
          <Column title="Semi-finals" matches={bracket.sf} />
          <Column title="Final" matches={bracket.final} />
          <div className="flex flex-col justify-center">
            <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-oracle-draw">
              Champion
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mt-2 flex w-40 flex-col items-center gap-2 rounded-xl border border-oracle-draw/40 bg-oracle-draw/10 p-4"
            >
              {bracket.champion && (
                <>
                  <span className="text-2xl">🏆</span>
                  <TeamBadge code={bracket.champion.code} size={40} />
                  <span className="text-center text-sm font-extrabold text-white">{bracket.champion.name}</span>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
