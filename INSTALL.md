# Installation guide

Football Oracle is a **single client-side app** — no backend, no database server to run. You only need the `frontend/`.

## Prerequisites

- **Node.js 18+** (tested on 20) and npm
- Optional: **Docker** (to serve the static build in a container)

---

## 1. Run it locally

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173/football-oracle/**. That's everything — the historical dataset is bundled and the prediction engine runs in your browser.

> **Windows / PowerShell:** the same commands work as-is.

---

## 2. Production build & preview

```bash
cd frontend
npm run build        # outputs static files to frontend/dist
npm run preview      # serves dist locally to check the production build
```

Optional build env (`frontend/.env`):

| Variable    | Purpose          | Example                              |
| ----------- | ---------------- | ------------------------------------ |
| `VITE_BASE` | Public base path | `/football-oracle/` (Pages) or `/`   |

---

## 3. Deploy to GitHub Pages

1. Push the repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`; the included workflow builds and publishes automatically to
   `https://<your-username>.github.io/football-oracle/`.
4. If the repo isn't named `football-oracle`, add repo **variable** `VITE_BASE = "/<repo>/"`
   (Settings → Secrets and variables → Actions → Variables).

---

## 4. Docker (optional)

```bash
docker compose up --build
```

Static site on **http://localhost:8080** (nginx serving the production build).

---

## 5. Regenerate the bundled dataset (optional)

Only needed if you change the seed in `backend/src/db/seed.ts`. The dataset is
already committed at `frontend/src/data/dataset.json`.

```bash
cd backend
npm install
npm run export:data   # rewrites frontend/src/data/dataset.json (deterministic)
```

---

## Troubleshooting

| Symptom                        | Fix                                                                |
| ------------------------------ | ------------------------------------------------------------------ |
| Blank page on GitHub Pages     | `VITE_BASE` must equal `/<repo-name>/`.                             |
| "Unknown team id" on a link    | The shared link's ids don't match the current dataset — re-pick.   |
| Want it at the domain root     | Build with `VITE_BASE=/` (and use a custom domain or user-site repo). |
