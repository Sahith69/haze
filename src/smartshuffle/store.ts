import type { DbLike } from './db';
import { classify, betaScore, Outcome } from './scoring';
import type { Track } from './picker';

export async function recordPlay(
  db: DbLike,
  p: { trackId: number; secondsPlayed: number; prevTrackId?: number; source?: string; now?: number },
): Promise<Outcome | null> {
  const now = p.now ?? Date.now();
  let result: Outcome | null = null;
  await db.withTransactionAsync(async () => {
    const t = await db.getFirstAsync<any>('SELECT * FROM tracks WHERE id = ?', p.trackId);
    if (!t) return;
    const outcome = classify(p.secondsPlayed, t.duration_ms);
    const next = {
      completions: t.completions + (outcome === 'complete' ? 1 : 0),
      early_skips: t.early_skips + (outcome === 'skip_early' ? 1 : 0),
      late_skips:  t.late_skips  + (outcome === 'skip_late'  ? 1 : 0),
      liked: t.liked,
    };
    await db.runAsync(
      `INSERT INTO plays (track_id, started_at, seconds_played, outcome, prev_track_id, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      p.trackId, now, p.secondsPlayed, outcome, p.prevTrackId ?? null, p.source ?? null);
    await db.runAsync(
      `UPDATE tracks SET plays = plays + 1, completions = ?, early_skips = ?, late_skips = ?,
       last_played_at = ?, score = ? WHERE id = ?`,
      next.completions, next.early_skips, next.late_skips, now, betaScore(next), p.trackId);
    result = outcome;
  });
  return result;
}

// Copies the bytes: a blob's byteOffset may not be 4-aligned, which makes a
// direct Float32Array view throw. Returns undefined for malformed blobs.
export function toFloat32(blob: Uint8Array, expectedDim?: number | null): Float32Array | undefined {
  if (!blob || blob.byteLength === 0 || blob.byteLength % 4 !== 0) return undefined;
  const v = new Float32Array(new Uint8Array(blob).buffer);
  if (expectedDim && v.length !== expectedDim) return undefined;
  return v;
}

export async function loadLibrary(db: DbLike): Promise<Track[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT id, artist, artist_key, album, work_key, score, plays, last_played_at,
            embedding, embedding_dim
     FROM tracks WHERE missing = 0`);
  return rows.map(r => ({
    id: r.id,
    artist: r.artist_key ?? r.artist,
    album: r.album,
    workKey: r.work_key,
    score: r.score,
    plays: r.plays,
    lastPlayedAt: r.last_played_at,
    vec: r.embedding ? toFloat32(r.embedding, r.embedding_dim) : undefined,
  }));
}

// Work keys of the most recently played songs (most recent first), for no-repeat.
export async function getRecentWorkKeys(db: DbLike, limit = 200): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ work_key: string }>(
    `SELECT t.work_key AS work_key
     FROM plays p JOIN tracks t ON t.id = p.track_id
     GROUP BY t.work_key
     ORDER BY MAX(p.started_at) DESC
     LIMIT ?`, limit);
  return new Set(rows.map(r => r.work_key));
}
