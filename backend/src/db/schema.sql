-- Football Oracle — SQLite schema.
-- Written to be Postgres-portable: no SQLite-only column types, integer ids,
-- explicit FKs. To migrate, swap AUTOINCREMENT -> SERIAL/IDENTITY and the
-- driver in `database.ts`; the repository SQL stays the same.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teams (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL UNIQUE,
  code                TEXT    NOT NULL,
  group_name          TEXT    NOT NULL DEFAULT 'International',
  elo                 REAL    NOT NULL DEFAULT 1500,
  win_rate            REAL    NOT NULL DEFAULT 0.5,
  avg_goals_scored    REAL    NOT NULL DEFAULT 1.3,
  avg_goals_conceded  REAL    NOT NULL DEFAULT 1.3,
  xg_for              REAL    NOT NULL DEFAULT 1.3,
  xg_against          REAL    NOT NULL DEFAULT 1.3,
  clean_sheet_rate    REAL    NOT NULL DEFAULT 0.3,
  possession          REAL    NOT NULL DEFAULT 0.5,
  shots_per_match     REAL    NOT NULL DEFAULT 12,
  pass_accuracy       REAL    NOT NULL DEFAULT 0.8
);

-- A team's own recent matches, used to derive last-10 form.
CREATE TABLE IF NOT EXISTS recent_matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id       INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent      TEXT    NOT NULL,
  is_home       INTEGER NOT NULL DEFAULT 1,
  goals_for     INTEGER NOT NULL,
  goals_against INTEGER NOT NULL,
  result        TEXT    NOT NULL CHECK (result IN ('W', 'D', 'L')),
  played_at     TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recent_team ON recent_matches(team_id, played_at DESC);

-- Head-to-head fixtures between two teams.
CREATE TABLE IF NOT EXISTS h2h_matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_goals    INTEGER NOT NULL,
  away_goals    INTEGER NOT NULL,
  competition   TEXT    NOT NULL DEFAULT 'Friendly',
  played_at     TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_h2h_pair ON h2h_matches(home_team_id, away_team_id);

-- Optional persistence of analyses (the frontend also keeps a local copy).
CREATE TABLE IF NOT EXISTS saved_predictions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team_id  INTEGER NOT NULL REFERENCES teams(id),
  away_team_id  INTEGER NOT NULL REFERENCES teams(id),
  payload       TEXT    NOT NULL, -- full analysis JSON
  created_at    TEXT    NOT NULL
);
