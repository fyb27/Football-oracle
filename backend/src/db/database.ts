import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

/**
 * Returns a singleton SQLite connection, creating the file + schema on first
 * use. This is the only file that knows we're on SQLite — everything else
 * goes through repositories, so a Postgres swap is localised here.
 */
export function getDb(): Database.Database {
  if (db) return db;

  if (config.dbPath !== ":memory:") {
    mkdirSync(dirname(config.dbPath), { recursive: true });
  }

  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);

  return db;
}

/** True when the database has no teams yet (used to trigger auto-seed). */
export function isEmpty(): boolean {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM teams")
    .get() as { n: number };
  return row.n === 0;
}
