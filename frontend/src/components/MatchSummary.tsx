import type { MatchAnalysis } from "../types";

export default function MatchSummary({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="glass p-5">
      <h3 className="mb-3 text-lg font-bold text-white">Key Match Analysis</h3>
      <p className="text-[15px] leading-relaxed text-slate-300">{analysis.summary}</p>

      {/* Factor weighting breakdown */}
      <div className="mt-5">
        <div className="section-title mb-2">Model weighting</div>
        <div className="space-y-1.5">
          {analysis.factors.map((f) => {
            const favorsHome = f.signal >= 0;
            const magnitude = Math.min(100, Math.abs(f.signal) * 100);
            return (
              <div key={f.key} className="flex items-center gap-3 text-xs">
                <span className="w-36 shrink-0 text-slate-400">
                  {f.label}
                  <span className="ml-1 text-slate-600">{Math.round(f.weight * 100)}%</span>
                </span>
                <div className="relative flex h-2 flex-1 items-center">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
                  <div className="flex h-full w-1/2 justify-end">
                    {!favorsHome && (
                      <div
                        className="h-full rounded-l-full bg-oracle-loss/70"
                        style={{ width: `${magnitude}%` }}
                      />
                    )}
                  </div>
                  <div className="flex h-full w-1/2">
                    {favorsHome && (
                      <div
                        className="h-full rounded-r-full bg-oracle-win/80"
                        style={{ width: `${magnitude}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
          <span>← favours {analysis.away.name}</span>
          <span>favours {analysis.home.name} →</span>
        </div>
      </div>
    </div>
  );
}
