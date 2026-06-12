import { Router } from "express";
import { getProvider } from "../data/provider.js";
import { analyzeMatch } from "../engine/index.js";
import { matchRepository } from "../repositories/matchRepository.js";

export const predictRouter = Router();

/**
 * GET /api/predict?home=<id>&away=<id>[&save=true]
 * Runs the full analysis pipeline for a single fixture.
 */
predictRouter.get("/", async (req, res, next) => {
  try {
    const home = Number(req.query.home);
    const away = Number(req.query.away);
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
      res.status(400).json({ error: "home and away team ids are required" });
      return;
    }

    const now = new Date().toISOString();
    const analysis = await analyzeMatch(getProvider(), home, away, now);

    if (req.query.save === "true") {
      const id = matchRepository.savePrediction(home, away, analysis, now);
      res.json({ analysis, savedId: id });
      return;
    }

    res.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    if (/Unknown|cannot play/.test(message)) {
      res.status(400).json({ error: message });
      return;
    }
    next(err);
  }
});
