# Football Oracle — Handoff

A football match-prediction web app. Pick two teams → get win/draw/loss probabilities, confidence, risk, and the most likely scorelines. Also includes a Monte Carlo **World Cup 2026** simulator. Built on real, current data.

- **Live site:** https://fyb27.github.io/Football-oracle/
- **Repo:** https://github.com/fyb27/Football-oracle
- **Local path:** `Desktop/goldmine/football-oracle/`

---

## 1. What it is / how it's hosted

- **Fully client-side.** React + Vite + TypeScript + Tailwind + Framer Motion. The prediction engine and a bundled dataset run entirely in the browser. **There is no backend and nothing to host** beyond static files.
- **Deploy:** GitHub Actions (`.github/workflows/deploy-frontend.yml`) builds `frontend/` and publishes to GitHub Pages on every push to `main`. The Pages base path is `/Football-oracle/` (must match the repo name's capital **F**).
- **`backend/`** is an optional **dev toolkit only** — it generates the bundled dataset. It is never deployed.

---

## 2. How the prediction works

Two independent models, blended.

**A. Weighted strength model** — each factor yields a signal in −1..+1 (positive favours the home team); the weighted sum is the "home edge", mapped to win/draw/loss.

| Factor | Weight | Source |
| --- | --- | --- |
| Elo rating | 30% | **Real** (eloratings.net, June 2026) |
| Recent form | 25% | **Real** results, last ~10, all 48 teams |
| Expected goals (xG) | 15% | Derived from real recent goals (see below) |
| Goals scored | 10% | Derived from real recent goals |
| Goals conceded | 10% | Derived from real recent goals |
| Head-to-head | 5% | Synthetic (strength-correlated) |
| Home advantage | 5% | Constant (0 on neutral/World Cup venues) |

**B. Poisson scoreline model** — attack/defence profiles become goal rates λ_home, λ_away (nudged by the strength edge); an independent bivariate Poisson grid (0-0…6-6, renormalised) gives every scoreline probability → top-5 + heatmap, and its own win/draw/loss.

**Blend:** final outcome = `0.55 × strength model + 0.45 × Poisson`.
**Confidence** rewards a clear favourite, a decisive edge, agreement between the two models, and stable form.
**Risk** is the inverse of those predictability signals.
**Insights** and the **summary** are interpretable functions of the same quantities (so the words never contradict the numbers).

**World Cup matches** are simulated on a **neutral venue** (`predict(..., {neutral:true})`) — home advantage is removed.

---

## 3. Data: what's real vs modelled (be honest about this)

| Data | Status |
| --- | --- |
| The 48 qualified teams | **Real** — confirmed (Wikipedia + FIFA). Italy & Denmark did NOT qualify. |
| Official group draw (A–L) | **Real** — cross-verified across two sources. |
| Elo ratings | **Real** — eloratings.net, June 2026 snapshot. 5 teams (Qatar, South Africa, Ghana, Curaçao, Haiti) approximated (no published value). |
| Recent form (last ~10) | **Real** — all 48 teams (ESPN/Wikipedia results). |
| Goals scored / conceded / xG | **Derived from real recent goals**, with blowout-capping (≤4/match) + Bayesian shrinkage toward the Elo prior. xG ≈ goals (national-team xG isn't published consistently). |
| Possession / shots / pass accuracy | **Modelled** from Elo (no real source). Shown in the comparison table only; not core to the prediction. |
| Head-to-head | **Synthetic** (deterministic, strength-correlated). |

**Accuracy notes / known limitations**
- Form opponents aren't all in the dataset, so recent goals are **not opponent-adjusted**. Capping + shrinkage mitigate the bias (e.g. Norway's 11-1 vs Moldova can't inflate their attack), but a team that played weak opposition may still read slightly strong.
- Elo + real form (W/D/L) is the backbone — Elo is the single best predictor of international results. The goal-based factors add scoring tendency on top.
- The World Cup simulator's **knockout seeding is a strength-based approximation** of FIFA's exact R32 bracket table — title odds are sound, the precise pairings are a projection.
- The simulator uses `Math.random`, so odds shift a percent or two on each fresh page load (cached within a session). To pin them, seed the RNG in `frontend/src/engine/simulate.ts`.

---

## 4. Project structure

```
football-oracle/
├── frontend/                       ← the entire app
│   ├── src/
│   │   ├── data/
│   │   │   ├── dataset.json         ← bundled real data (48 teams, form, groups, h2h)
│   │   │   └── staticProvider.ts    ← reads the dataset in-browser
│   │   ├── engine/                  ← prediction engine (pure TS)
│   │   │   ├── elo.ts  prediction.ts  poisson.ts
│   │   │   ├── confidence.ts  risk.ts  insights.ts  summary.ts
│   │   │   ├── analyze.ts           ← single-match orchestrator
│   │   │   ├── simulate.ts          ← Monte Carlo World Cup simulator
│   │   │   └── fixtures.ts
│   │   ├── api/client.ts            ← runs the engine locally (swap-seam for a real API)
│   │   ├── components/              ← ResultView + widgets; wc/ = World Cup views
│   │   ├── pages/                   ← Home, WorldCup, BestToday, History, Favorites
│   │   └── types.ts
│   └── vite.config.ts
├── backend/                        ← OPTIONAL dataset toolkit (not deployed)
│   └── src/db/seed.ts              ← roster, real form, group draw, stat derivation
│       └── scripts/export-dataset.ts  ← writes frontend/src/data/dataset.json
├── .github/workflows/deploy-frontend.yml
├── README.md  INSTALL.md  HANDOFF.md
```

---

## 5. Run / build / deploy

```bash
# Run locally (the whole app)
cd frontend && npm install && npm run dev      # http://localhost:5173/Football-oracle/  (base is /football-oracle/ in dev)

# Production build
cd frontend && npm run build                   # outputs frontend/dist

# Deploy: just push to main — GitHub Actions builds + publishes to Pages.
git push origin main
```

**Regenerate the dataset** (only if you edit the seed):
```bash
cd backend && npm install && npm run export:data   # rewrites frontend/src/data/dataset.json
# then rebuild/redeploy the frontend
```

---

## 6. Where to change things

- **Add/remove/edit a team, its Elo, or its form:** `backend/src/db/seed.ts` (`ROSTER`, `REAL_FORM`, `GROUPS`) → `npm run export:data` → rebuild.
- **Tune the model:** weights and mapping in `frontend/src/engine/prediction.ts`; blend ratio in `frontend/src/engine/analyze.ts`.
- **Stat derivation (capping/shrinkage):** `statsFromForm()` in `backend/src/db/seed.ts`.
- **Simulator (sims count, seeding, pens):** `frontend/src/engine/simulate.ts`.
- **Plug in a real live-data API later:** reimplement the methods in `frontend/src/api/client.ts` as `fetch` calls; the UI is unchanged. (A secret API key would then require a small backend/serverless proxy.)

---

## 7. Accuracy posture (summary)

This is a well-calibrated **statistical model on real ratings + real recent form**, not a live data feed and not a guarantee. Its strongest, fully-real signals are **Elo (30%)** and **recent form (25%)**; scoring rates are derived from **real recent goals** (robustly). It is built for informed, entertaining predictions among friends — bet responsibly.
