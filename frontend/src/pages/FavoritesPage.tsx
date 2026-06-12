import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api/client";
import type { TeamListItem } from "../types";
import { favorites } from "../lib/storage";
import TeamBadge from "./../components/TeamBadge";

export default function FavoritesPage() {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [favIds, setFavIds] = useState<number[]>(favorites.all());
  const navigate = useNavigate();

  useEffect(() => {
    api.listTeams().then(setTeams).catch(() => undefined);
  }, []);

  const favTeams = teams.filter((t) => favIds.includes(t.id));

  function toggle(id: number) {
    setFavIds(favorites.toggle(id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Favorite Teams</h1>
        <p className="mt-1 text-slate-400">Star teams for quick access. They’re pinned to the top of every dropdown.</p>
      </div>

      {favTeams.length >= 2 && (
        <button
          className="btn-primary"
          onClick={() => navigate(`/?home=${favTeams[0].id}&away=${favTeams[1].id}`)}
        >
          ⚡ Predict {favTeams[0].code} vs {favTeams[1].code}
        </button>
      )}

      {favTeams.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 p-12 text-center">
          <span className="text-4xl">⭐</span>
          <h3 className="text-lg font-bold text-white">No favorites yet</h3>
          <p className="max-w-sm text-sm text-slate-400">
            Pick teams below — or star them straight from a prediction’s action bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favTeams.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="glass flex flex-col items-center gap-2 p-4 text-center"
            >
              <TeamBadge code={t.code} size={48} />
              <div className="font-semibold text-white">{t.name}</div>
              <div className="text-xs text-slate-500">Elo {t.elo}</div>
              <button className="text-sm text-oracle-draw" onClick={() => toggle(t.id)}>
                ★ Remove
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* All teams to add */}
      {teams.length > 0 && (
        <div>
          <div className="section-title mb-3">All teams</div>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => {
              const fav = favIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`chip transition ${fav ? "border-oracle-draw/40 bg-oracle-draw/10 text-oracle-draw" : "text-slate-300 hover:bg-white/10"}`}
                >
                  {fav ? "★" : "☆"} {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
