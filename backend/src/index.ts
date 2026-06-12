import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { config } from "./config.js";
import { getDb, isEmpty } from "./db/database.js";
import { seed } from "./db/seed.js";
import { teamsRouter } from "./routes/teams.js";
import { predictRouter } from "./routes/predict.js";
import { bestRouter } from "./routes/best.js";

// Initialise the database and seed on first boot if empty.
getDb();
if (config.autoSeed && isEmpty()) {
  const result = seed();
  console.log(`[db] seeded ${result.teams} teams`);
}

const app = express();
app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "football-oracle", time: new Date().toISOString() });
});

app.use("/api/teams", teamsRouter);
app.use("/api/predict", predictRouter);
app.use("/api/best-today", bestRouter);

// 404 for unknown API routes.
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[error]", message);
  res.status(500).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`⚽ Football Oracle API listening on http://localhost:${config.port}`);
});
