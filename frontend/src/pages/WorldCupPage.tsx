import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import type { SimResult } from "../engine/simulate";
import TitleOdds from "../components/wc/TitleOdds";
import GroupGrid from "../components/wc/GroupGrid";
import Bracket from "../components/wc/Bracket";
import TeamBadge from "../components/TeamBadge";

type Tab = "odds" | "groups" | "bracket";

export default function WorldCupPage() {
  const [sim, setSim] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("odds");

  useEffect(() => {
    let active = true;
    api
      .simulate(10000)
      .then((r) => active && setSim(r))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const favourite = sim?.teams[0];
  const finalists = sim?.bracket.final[0];

  return (
    <div className="space-y-7">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl"
        >
          World Cup 2026
        </motion.h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-400">
          The whole tournament, simulated {sim ? sim.sims.toLocaleString() : "10,000"}× from real ratings & form.
        </p>
      </div>

      {error && (
        <div className="mx-auto max-w-md rounded-xl border border-oracle-loss/40 bg-oracle-loss/10 p-4 text-center text-oracle-loss">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!sim && !error && <Loading key="loading" />}

        {sim && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Favourite hero */}
            {favourite && (
              <div className="glass-strong flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
                <div className="flex items-center gap-4">
                  <TeamBadge code={favourite.code} size={56} />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Model favourite
                    </div>
                    <div className="text-2xl font-black text-white">{favourite.name}</div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <Stat label="Win cup" value={`${(favourite.champion * 100).toFixed(1)}%`} accent />
                  <Stat label="Reach final" value={`${(favourite.finalist * 100).toFixed(0)}%`} />
                  {finalists && (
                    <Stat label="Proj. final" value={`${finalists.a?.code ?? "?"} v ${finalists.b?.code ?? "?"}`} />
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
                {([
                  ["odds", "Title Odds"],
                  ["groups", "Groups"],
                  ["bracket", "Bracket"],
                ] as Array<[Tab, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative rounded-full px-4 py-1.5 font-medium transition ${
                      tab === key ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab === key && (
                      <motion.span layoutId="wc-tab" className="absolute inset-0 -z-10 rounded-full bg-white/10" />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "odds" && <TitleOdds teams={sim.teams} />}
                {tab === "groups" && <GroupGrid groups={sim.groups} />}
                {tab === "bracket" && <Bracket bracket={sim.bracket} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-black tabular-nums ${accent ? "text-oracle-win" : "text-white"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass flex flex-col items-center gap-4 p-12 text-center"
    >
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-white/15 border-t-oracle-accent"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />
      <div>
        <div className="font-semibold text-white">Simulating 10,000 tournaments…</div>
        <div className="text-sm text-slate-400">Group stage → knockouts → champion, for all 48 teams.</div>
      </div>
    </motion.div>
  );
}
