import type { DbLike } from './db';

export const SCHEMA_VERSION = 1;

export const PRAGMAS = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;`;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tracks (
  id                INTEGER PRIMARY KEY,
  uri               TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  artist            TEXT NOT NULL,
  album             TEXT NOT NULL DEFAULT '',
  duration_ms       INTEGER NOT NULL,
  work_key          TEXT NOT NULL,
  artist_key        TEXT,
  mbid              TEXT,
  added_at          INTEGER NOT NULL,
  file_mtime        INTEGER NOT NULL DEFAULT 0,
  missing           INTEGER NOT NULL DEFAULT 0,
  plays             INTEGER NOT NULL DEFAULT 0,
  completions       INTEGER NOT NULL DEFAULT 0,
  early_skips       INTEGER NOT NULL DEFAULT 0,
  late_skips        INTEGER NOT NULL DEFAULT 0,
  liked             INTEGER NOT NULL DEFAULT 0,
  last_played_at    INTEGER,
  score             REAL NOT NULL DEFAULT 0.5,
  embedding         BLOB,
  embedding_dim     INTEGER,
  embedding_version INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tracks_work_key   ON tracks(work_key);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_key ON tracks(artist_key);
CREATE INDEX IF NOT EXISTS idx_tracks_last_play  ON tracks(last_played_at);
CREATE INDEX IF NOT EXISTS idx_tracks_no_embed   ON tracks(id) WHERE embedding IS NULL;

CREATE TABLE IF NOT EXISTS plays (
  id             INTEGER PRIMARY KEY,
  track_id       INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  started_at     INTEGER NOT NULL,
  seconds_played REAL NOT NULL,
  outcome        TEXT NOT NULL CHECK (outcome IN ('complete','skip_early','skip_late')),
  prev_track_id  INTEGER,
  source         TEXT
);
CREATE INDEX IF NOT EXISTS idx_plays_track ON plays(track_id, started_at);
CREATE INDEX IF NOT EXISTS idx_plays_time  ON plays(started_at);

CREATE TABLE IF NOT EXISTS not_duplicates (
  work_key_a TEXT NOT NULL,
  work_key_b TEXT NOT NULL,
  PRIMARY KEY (work_key_a, work_key_b)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`;

export async function migrate(db: DbLike): Promise<void> {
  await db.execAsync(PRAGMAS);
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) return;
  await db.execAsync(SCHEMA_SQL);
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
