import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TeamListItem } from "../types";
import TeamBadge from "./TeamBadge";
import { favorites } from "../lib/storage";

interface Props {
  label: string;
  teams: TeamListItem[];
  value: number | null;
  onChange: (id: number) => void;
  excludeId?: number | null;
}

/** Searchable, keyboard-friendly team dropdown with favorites pinned to top. */
export default function TeamSelect({ label, teams, value, onChange, excludeId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.id === value) ?? null;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const favIds = favorites.all();
    const q = query.trim().toLowerCase();
    return teams
      .filter((t) => t.id !== excludeId)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
      .sort((a, b) => {
        const fa = favIds.includes(a.id) ? 0 : 1;
        const fb = favIds.includes(b.id) ? 0 : 1;
        return fa - fb || b.elo - a.elo;
      });
  }, [teams, query, excludeId]);

  return (
    <div className="relative w-full" ref={ref}>
      <label className="section-title mb-2 block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-oracle-accent/60"
      >
        {selected ? (
          <span className="flex items-center gap-3">
            <TeamBadge code={selected.code} size={32} />
            <span>
              <span className="block font-semibold text-white">{selected.name}</span>
              <span className="block text-xs text-slate-400">Elo {selected.elo}</span>
            </span>
          </span>
        ) : (
          <span className="text-slate-400">Select a team…</span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-slate-400">
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute z-40 mt-2 max-h-72 w-full overflow-hidden"
          >
            <div className="border-b border-white/10 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams…"
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <li className="px-3 py-3 text-sm text-slate-400">No teams match “{query}”.</li>
              )}
              {filtered.map((t) => {
                const isFav = favorites.has(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(t.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10 ${
                        t.id === value ? "bg-white/10" : ""
                      }`}
                    >
                      <TeamBadge code={t.code} size={28} />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-white">{t.name}</span>
                        <span className="block text-xs text-slate-400">{t.group}</span>
                      </span>
                      {isFav && <span className="text-oracle-draw">★</span>}
                      <span className="text-xs text-slate-500">{t.elo}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
