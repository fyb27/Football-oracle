import { Router } from "express";
import { getProvider } from "../data/provider.js";

export const teamsRouter = Router();

/** GET /api/teams — all teams (for the dropdowns + search). */
teamsRouter.get("/", async (_req, res, next) => {
  try {
    const teams = await getProvider().listTeams();
    res.json({
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        group: t.group,
        elo: Math.round(t.elo),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/teams/:id — full team profile including stats + recent form. */
teamsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const provider = getProvider();
    const team = await provider.getTeam(id);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const form = await provider.getRecentForm(id);
    res.json({ team, form });
  } catch (err) {
    next(err);
  }
});
