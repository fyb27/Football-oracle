import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import type { MatchAnalysis } from "../types";
import TeamBadge from "./TeamBadge";
import ProbabilityCards from "./ProbabilityCards";
import ConfidenceStars from "./ConfidenceStars";
import RiskMeter from "./RiskMeter";
import ScorePredictions from "./ScorePredictions";
import InsightsPanel from "./InsightsPanel";
import MatchSummary from "./MatchSummary";
import TeamComparison from "./TeamComparison";
import RecentForm from "./RecentForm";
import HeadToHead from "./HeadToHead";
import { favorites } from "../lib/storage";

export default function ResultView({ analysis }: { analysis: MatchAnalysis }) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [favs, setFavs] = useState<number[]>(favorites.all());

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  async function exportImage() {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: "#070a12",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${analysis.home.code}-vs-${analysis.away.code}-oracle.png`;
      link.href = dataUrl;
      link.click();
      flash("Image downloaded");
    } catch {
      flash("Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function shareLink() {
    const url = `${window.location.origin}${window.location.pathname}#/?home=${analysis.home.id}&away=${analysis.away.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Football Oracle", text: `${analysis.home.name} vs ${analysis.away.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Share link copied");
    } catch {
      flash("Could not share");
    }
  }

  function toggleFav(id: number) {
    setFavs(favorites.toggle(id));
  }

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button className="btn-ghost" onClick={() => toggleFav(analysis.home.id)}>
          {favs.includes(analysis.home.id) ? "★" : "☆"} {analysis.home.code}
        </button>
        <button className="btn-ghost" onClick={() => toggleFav(analysis.away.id)}>
          {favs.includes(analysis.away.id) ? "★" : "☆"} {analysis.away.code}
        </button>
        <button className="btn-ghost" onClick={shareLink}>
          🔗 Share
        </button>
        <button className="btn-ghost" onClick={exportImage} disabled={exporting}>
          {exporting ? "Rendering…" : "🖼️ Export"}
        </button>
      </div>

      <div ref={captureRef} className="space-y-5">
        {/* Match header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong flex items-center justify-between gap-4 p-5"
        >
          <TeamSide code={analysis.home.code} name={analysis.home.name} elo={analysis.home.elo} align="left" />
          <div className="shrink-0 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Prediction</div>
            <div className="text-2xl font-black text-white">VS</div>
          </div>
          <TeamSide code={analysis.away.code} name={analysis.away.name} elo={analysis.away.elo} align="right" />
        </motion.div>

        {/* PRIORITY 1–3: Win / Draw / Loss */}
        <ProbabilityCards analysis={analysis} />

        {/* PRIORITY 4–5: Confidence + Risk */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ConfidenceStars confidence={analysis.confidence} />
          <RiskMeter risk={analysis.risk} />
        </div>

        {/* PRIORITY 6: Top 5 score predictions */}
        <ScorePredictions analysis={analysis} />

        {/* Everything else, below the fold */}
        <InsightsPanel insights={analysis.insights} />
        <MatchSummary analysis={analysis} />
        <TeamComparison analysis={analysis} />
        <RecentForm analysis={analysis} />
        <HeadToHead analysis={analysis} />
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-ink-800/90 px-5 py-2.5 text-sm font-medium text-white shadow-glass backdrop-blur"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}

function TeamSide({
  code,
  name,
  elo,
  align,
}: {
  code: string;
  name: string;
  elo: number;
  align: "left" | "right";
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamBadge code={code} size={52} />
      <div className="min-w-0">
        <div className="truncate text-lg font-extrabold text-white">{name}</div>
        <div className="text-xs text-slate-400">Elo {elo}</div>
      </div>
    </div>
  );
}
