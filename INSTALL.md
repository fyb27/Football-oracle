# Installation guide

## Prerequisites

- **Node.js 18+** (tested on 20) and npm
- Optional: **Docker** (for the one-command full stack)

---

## 1. Run locally (two terminals)

### Backend

```bash
cd backend
npm install
npm run dev
```

- Starts on **http://localhost:4000**.
- On first boot it creates `backend/data/football-oracle.db` and seeds 24 teams + form + head-to-head automatically.
- Check it: open http://localhost:4000/api/health → `{"status":"ok",...}`.

> **Windows / PowerShell:** the same commands work. `better-sqlite3` ships prebuilt binaries; if your platform needs to compile it, install the Visual Studio "Desktop development with C++" workload first.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Open **http://localhost:5173/football-oracle/**.
- Vite proxies `/api/*` to the backend on :4000 — no extra config in dev.

---

## 2. Re-seed the database

```bash
cd backend
npm run seed        # wipes + regenerates the seed data (deterministic)
```

Delete `backend/data/football-oracle.db` to start completely fresh (it re-seeds on next boot).

---

## 3. Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

Frontend env (set before `npm run build`, e.g. in `frontend/.env`):

| Variable       | Purpose                                                | Example                              |
| -------------- | ------------------------------------------------------ | ------------------------------------ |
| `VITE_API_URL` | Backend origin the built app calls (blank = dev proxy) | `https://api.example.com`            |
| `VITE_BASE`    | Public base path                                       | `/football-oracle/` (Pages) or `/`   |

Backend env (`backend/.env`, see `.env.example`):

| Variable      | Default                     | Purpose                          |
| ------------- | --------------------------- | -------------------------------- |
| `PORT`        | `4000`                      | API port                         |
| `CORS_ORIGIN` | `*`                         | Allowed origin(s), comma-list    |
| `DB_PATH`     | `data/football-oracle.db`   | SQLite file path                 |
| `AUTO_SEED`   | `true`                      | Seed when the DB is empty        |

---

## 4. Docker (full stack)

```bash
docker compose up --build
```

- Web → **http://localhost:8080**, API → **http://localhost:4000**.
- The frontend image bakes `VITE_API_URL=http://localhost:4000`; change it in `docker-compose.yml` for a real deployment.
- SQLite data persists in the `oracle-data` volume.

---

## 5. Deploy

**Frontend (GitHub Pages):** push to `main` with Pages source = "GitHub Actions". The workflow builds and deploys automatically. Set repo variable `VITE_API_URL` to your backend URL (and `VITE_BASE` if the repo isn't named `football-oracle`).

**Backend:** deploy `backend/` to any Node host (Render/Railway/Fly/VPS) or use its Dockerfile. Set `CORS_ORIGIN` to your Pages URL and mount a volume for `DB_PATH`.

---

## Troubleshooting

| Symptom                                    | Fix                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Frontend shows "Couldn't reach the API"    | Start the backend; confirm http://localhost:4000/api/health responds.  |
| CORS error in production                   | Set `CORS_ORIGIN` on the backend to your exact frontend origin.        |
| Blank page on GitHub Pages                 | `VITE_BASE` must equal `/<repo-name>/`.                                 |
| `better-sqlite3` build error               | Install build tools (see Windows note above) or use the Docker image.  |
