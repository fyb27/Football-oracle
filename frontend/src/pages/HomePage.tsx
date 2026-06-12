import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api/client";
import type { MatchAnalysis, TeamListItem } from "../types";
import TeamSelect from "../components/TeamSelect";
import ResultView from "../components/ResultView";
import { history } from "../lib/storage";

export default function HomePage() {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [homeId, setHomeId] = useState<number | null>(null);
  const [awayId, setAwayId] = useState<number | null>(null);

  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load teams once.
  useEffect(() => {
    api
      .listTeams()
      .then(setTeams)
      .catch((e) => setLoadError(e.message));
  }, []);

  // Hydrate selection from a shared link (?home=&away=) and auto-run it.
  useEffect(() => {
    const h = Number(searchParams.get("home"));
    const a = Number(searchParams.get("away"));
    if (Number.isFinite(h) && h > 0) setHomeId(h);
    if (Number.isFinite(a) && a > 0) setAwayId(a);
    if (h > 0 && a > 0 && h !== a) runAnalysis(h, a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalysis(h: number, a: number) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.predict(h, a);
      setAnalysis(result);
      history.add(result);
      setSearchParams({ home: String(h), away: String(a) }, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = homeId !== null && awayId !== null && homeId !== awayId && !loading;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl"
        >
          Football Oracle
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-3 max-w-xl text-balance text-slate-400 sm:text-lg"
        >
          Predict football matches using statistics and probability models.
        </motion.p>
      </div>

      {/* Input section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-strong mx-auto max-w-3xl p-5 sm:p-6"
      >
        {loadError ? (
          <div className="rounded-xl border border-oracle-loss/40 bg-oracle-loss/10 p-4 text-center text-sm text-oracle-loss">
            Couldn’t reach the prediction API: {loadError}
            <div className="mt-1 text-xs text-slate-400">
              Is the backend running? Start it with <code>npm run dev</code> in <code>/backend</code>.
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <TeamSelect label="Home Team" teams={teams} value={homeId} onChange={setHomeId} excludeId={awayId} />
              <div className="hidden pb-3 text-center text-sm font-bold text-slate-500 sm:block">vs</div>
              <TeamSelect label="Away Team" teams={teams} value={awayId} onChange={setAwayId} excludeId={homeId} />
            </div>
            <div className="mt-5 flex justify-center">
              <button
                className="btn-primary w-full sm:w-auto sm:px-10"
                disabled={!canAnalyze}
                onClick={() => homeId && awayId && runAnalysis(homeId, awayId)}
              >
                {loading ? "Analyzing…" : "⚡ Analyze Match"}
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Result area */}
      <AnimatePresence mode="wait">
        {loading && <LoadingState key="loading" />}
        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-2xl rounded-xl border border-oracle-loss/40 bg-oracle-loss/10 p-4 text-center text-oracle-loss"
          >
            {error}
          </motion.div>
        )}
        {analysis && !loading && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultView analysis={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass h-44 animate-pulse" />
        <div className="glass h-44 animate-pulse" />
      </div>
      <div className="glass h-64 animate-pulse" />
    </motion.div>
  );
}
