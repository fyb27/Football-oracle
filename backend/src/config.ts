/**
 * Centralised runtime configuration. Everything is environment-driven so the
 * same build runs locally, in Docker, or on a hosted backend without edits.
 */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  // Comma-separated allowlist. "*" (default) allows any origin — fine for a
  // friends-only app, tighten in production by setting CORS_ORIGIN.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Absolute or relative path to the SQLite file. ":memory:" is supported for
  // ephemeral test runs.
  dbPath: process.env.DB_PATH ?? "data/football-oracle.db",
  // Re-seed on boot if the teams table is empty. Set to "false" to disable.
  autoSeed: (process.env.AUTO_SEED ?? "true") !== "false",
} as const;
