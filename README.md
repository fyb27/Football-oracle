# ⚽ Football Oracle

> Predict football matches using statistics and probability models.

A premium, dark-mode football match prediction app for you and your friends. Pick two teams, hit **Analyze Match**, and get the six things that actually matter — **Win % · Draw % · Loss % · Confidence · Risk · Top-5 likely scores** — backed by a real Elo + weighted-factor + Poisson model, plus form, head-to-head, AI insights and an auto-generated match summary.

![Football Oracle prediction view](docs/preview.png)

---

## ✨ Features

- **Match prediction** — three-way win/draw/loss probabilities from a weighted strength model.
- **Confidence score** — 0–100 + ⭐ rating + label (Low → Very High).
- **Risk meter** — 🟢/🟡/🔴 from strength gap, model agreement, historical predictability and form consistency.
- **Top-5 likely scores** — ranked list, probability bars and a full scoreline heatmap (Poisson).
- **AI insights** — auto-generated chips ("strong home advantage", "both teams to score", "upset warning"…).
- **Key match analysis** — a natural-language summary that always matches the numbers.
- **Team comparison** — form, goals, xG/xGA, clean sheets, win rate, possession, shots, pass accuracy.
- **Recent form** — last-10 W/D/L for both sides.
- **Head-to-head** — meetings, wins/draws, goals and recent results.
- **Best Predictions Today** — top-20 daily fixtures ranked by confidence.
- **Extras** — searchable team dropdowns, favorite teams, prediction history, export-as-image, shareable links — all persisted locally so the static frontend works on GitHub Pages.

---

## 🧱 Tech stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion |
| Backend  | Node.js · Express · TypeScript                              |
| Database | SQLite (`better-sqlite3`) — Postgres-portable schema        |
| Deploy   | Frontend → GitHub Pages · Backend → any Node host · Docker  |

---

## 📁 Project structure

```
football-oracle/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app + bootstrap (auto-seed)
│   │   ├── config.ts             # env-driven config
│   │   ├── data/
│   │   │   ├── types.ts          # domain types + MatchDataProvider contract
│   │   │   └── provider.ts       # LocalDbProvider (swap for a real API here)
│   │   ├── db/
│   │   │   ├── schema.sql         # Postgres-portable schema
│   │   │   ├── database.ts        # the only SQLite-aware file
│   │   │   └── seed.ts            # deterministic seed data generator
│   │   ├── repositories/          # SQL → domain mapping
│   │   ├── engine/                # ★ the prediction engine
│   │   │   ├── elo.ts             # Elo ratings + expected score
│   │   │   ├── prediction.ts      # weighted factor model + goal rates
│   │   │   ├── poisson.ts         # Poisson scoreline matrix
│   │   │   ├── confidence.ts      # confidence scoring
│   │   │   ├── risk.ts            # risk scoring
│   │   │   ├── insights.ts        # rule-based AI insight chips
│   │   │   ├── summary.ts         # natural-language summary
│   │   │   └── index.ts           # analyzeMatch() orchestrator
│   │   ├── routes/                # /teams /predict /best-today
│   │   └── fixtures.ts            # deterministic daily slate
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # typed API client
│   │   ├── components/            # ResultView + all widgets
│   │   ├── pages/                 # Home, Best Today, History, Favorites
│   │   ├── lib/                   # format helpers + localStorage store
│   │   └── types.ts               # response types (mirror of engine)
│   ├── Dockerfile + nginx.conf
│   └── vite.config.ts
├── .github/workflows/deploy-frontend.yml
├── docker-compose.yml
├── INSTALL.md
└── README.md
```

---

## 🧮 The prediction engine

The headline numbers come from **two independent models** that are then blended:

**1. Weighted strength model** — each factor produces a signal in `-1..1` (positive favours the home team); the weighted sum is the "home edge", mapped to win/draw/loss.

| Factor          | Weight |
| --------------- | ------ |
| Elo rating      | 30%    |
| Recent form     | 25%    |
| Expected goals  | 15%    |
| Goals scored    | 10%    |
| Goals conceded  | 10%    |
| Head-to-head    | 5%     |
| Home advantage  | 5%     |

- **Elo** uses the standard logistic expected score with a home-field bonus (`backend/src/engine/elo.ts`).
- The home edge maps to outcomes via a draw rate that shrinks as the mismatch grows.

**2. Poisson scoreline model** — attack/defence profiles (blending goals + xG) become goal rates λ<sub>home</sub>, λ<sub>away</sub>, nudged by the strength edge. An independent bivariate Poisson grid (0-0…6-6, renormalised) yields every scoreline probability → sorted for the top-5 and the heatmap, and summed into its own win/draw/loss.

**Blend & derived metrics**

- Final outcome = `0.55 × strength model + 0.45 × Poisson`.
- **Confidence** rewards a clear favourite, a decisive edge, agreement between the two models, and stable form.
- **Risk** is the inverse of those predictability signals (strength gap, model agreement, H2H decisiveness, form consistency).
- **Insights** and **summary** are interpretable functions of these same quantities — so the words never contradict the numbers.

> Seed data is generated from a **fixed RNG seed**, so the same matchup always returns the same prediction. Swap in real data without touching the engine (see below).

---

## 🚀 Quick start

```bash
# 1. Backend  (terminal 1)
cd backend
npm install
npm run dev          # → http://localhost:4000  (auto-seeds on first run)

# 2. Frontend (terminal 2)
cd frontend
npm install
npm run dev          # → http://localhost:5173/football-oracle/
```

The dev server proxies `/api` to the backend, so no extra config is needed. Full step-by-step (incl. Windows/PowerShell) is in **[INSTALL.md](INSTALL.md)**.

### With Docker

```bash
docker compose up --build
# web → http://localhost:8080   api → http://localhost:4000
```

---

## 🌐 Deployment

**Frontend → GitHub Pages** (automated via `.github/workflows/deploy-frontend.yml`):

1. Push to `main`. In **Settings → Pages**, set source to **GitHub Actions**.
2. Add a repo **variable** `VITE_API_URL` pointing at your deployed backend (e.g. `https://football-oracle-api.onrender.com`).
3. (If your repo isn't named `football-oracle`, also set variable `VITE_BASE` to `"/<your-repo>/"`.)

**Backend → any Node host** (Render, Railway, Fly.io, a VPS, or the included Docker image):

- Set `CORS_ORIGIN` to your Pages URL, mount a volume for `DB_PATH`, and run `npm run build && npm start`.

---

## 🔌 Plugging in real data

Everything reads through the `MatchDataProvider` interface (`backend/src/data/types.ts`). To use a real football API:

1. Implement the interface in a new class (fetch + map upstream payloads into the domain types).
2. Return it from `getProvider()` in `backend/src/data/provider.ts`.

The engine, routes and frontend stay exactly the same.

### Postgres migration

The schema (`backend/src/db/schema.sql`) avoids SQLite-only constructs. To migrate: point a Postgres driver at it (swap `AUTOINCREMENT` → `GENERATED … AS IDENTITY`), update `db/database.ts`, and the repositories' SQL carries over unchanged.

---

## 📡 API reference

| Method | Path                                | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| `GET`  | `/api/health`                       | Liveness check                           |
| `GET`  | `/api/teams`                        | All teams (for dropdowns)                |
| `GET`  | `/api/teams/:id`                    | Team profile + recent form               |
| `GET`  | `/api/predict?home=<id>&away=<id>`  | Full match analysis (`&save=true` to store) |
| `GET`  | `/api/best-today`                   | Top-20 daily fixtures by confidence      |

---

## ⚠️ Disclaimer

Predictions are statistical estimates from a model on seeded data — not guarantees. For entertainment among friends. Bet responsibly.
