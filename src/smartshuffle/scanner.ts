import type { DbLike } from './db';
import { makeKey, fuzzySameTitle } from './workKey';

export type RawFile = { uri: string; filename: string; durationMs: number; modifiedMs: number };
export type Tags = {
  title?: string; artist?: string; albumArtist?: string; album?: string;
  mbid?: string; durationMs?: number;
};
export interface FileSource { listAudioFiles(): Promise<RawFile[]> }
export interface TagReader  { read(uri: string): Promise<Tags | null> }

type Row = {
  id: number; uri: string; file_mtime: number; work_key: string;
  album: string; duration_ms: number; missing: number;
};

export type ScanOptions = {
  concurrency?: number; chunkSize?: number; minDurationMs?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: { aborted: boolean };
};

export async function scanLibrary(
  db: DbLike, source: FileSource, reader: TagReader, opts: ScanOptions = {},
) {
  const { concurrency = 4, chunkSize = 100, minDurationMs = 30_000, onProgress, signal } = opts;

  const files = (await source.listAudioFiles()).filter(f => f.durationMs >= minDurationMs);
  const rows = await db.getAllAsync<Row>(
    'SELECT id, uri, file_mtime, work_key, album, duration_ms, missing FROM tracks');

  // Guard: a permission glitch returning [] must not mark the whole library missing.
  if (files.length === 0 && rows.length > 0)
    throw new Error('Source returned no files; refusing to mark the library as missing.');

  const seen = new Set(files.map(f => f.uri));
  const byUri = new Map(rows.map(r => [r.uri, r]));

  // Rows whose file vanished: either deleted or moved. Index by work_key for move detection.
  const lostByKey = new Map<string, Row[]>();
  for (const r of rows) {
    if (seen.has(r.uri)) continue;
    const list = lostByKey.get(r.work_key) ?? [];
    list.push(r); lostByKey.set(r.work_key, list);
  }

  const revived: number[] = [];
  const todo: RawFile[] = [];
  for (const f of files) {
    const r = byUri.get(f.uri);
    if (!r || r.file_mtime !== f.modifiedMs) todo.push(f);   // new or changed
    else if (r.missing) revived.push(r.id);                  // file came back untouched
  }

  // artistKey -> (workKey -> titleKey), for fuzzy typo matching within one artist
  const index = new Map<string, Map<string, string>>();
  const bucket = (a: string) => {
    let b = index.get(a); if (!b) { b = new Map(); index.set(a, b); } return b;
  };
  for (const r of rows) {
    const [t, a] = r.work_key.split('_');
    if (a !== undefined) bucket(a).set(r.work_key, t);
  }

  const notDup = new Set<string>();
  const pairs = await db.getAllAsync<{ work_key_a: string; work_key_b: string }>(
    'SELECT work_key_a, work_key_b FROM not_duplicates');
  for (const p of pairs) {
    notDup.add(`${p.work_key_a}|${p.work_key_b}`);
    notDup.add(`${p.work_key_b}|${p.work_key_a}`);
  }

  function resolveKey(tKey: string, aKey: string): string {
    const exact = `${tKey}_${aKey}`;
    const b = bucket(aKey);
    if (b.has(exact)) return exact;
    for (const [existingKey, existingTitle] of b) {
      if (notDup.has(`${exact}|${existingKey}`)) continue;
      if (fuzzySameTitle(tKey, existingTitle)) return existingKey;  // adopt the existing key
    }
    b.set(exact, tKey);
    return exact;
  }

  const stats = { added: 0, updated: 0, moved: 0, missing: 0, revived: revived.length };
  let done = 0;

  for (let i = 0; i < todo.length; i += chunkSize) {
    if (signal?.aborted) break;
    const chunk = todo.slice(i, i + chunkSize);
    const tags = await mapLimit(chunk, concurrency, f => reader.read(f.uri).catch(() => null));

    await db.withTransactionAsync(async () => {
      for (let j = 0; j < chunk.length; j++) {
        const f = chunk[j];
        const t = resolveTags(f, tags[j]);
        const { titleKey: tKey, artistKey: aKey } =
          makeKey(t.title, t.artist || `unknown ${t.album}`);
        const key = resolveKey(tKey, aKey);

        // Moved file? Same work, similar duration, old path gone -> keep history.
        const lost = lostByKey.get(key);
        const idx = lost ? lost.findIndex(r => Math.abs(r.duration_ms - t.durationMs) <= 1500) : -1;
        if (lost && idx >= 0) {
          const old = lost.splice(idx, 1)[0];
          await db.runAsync(
            `UPDATE tracks SET uri=?, title=?, artist=?, album=?, duration_ms=?, work_key=?,
             artist_key=?, file_mtime=?, missing=0 WHERE id=?`,
            f.uri, t.title, t.artist || 'Unknown Artist', t.album, t.durationMs,
            key, aKey, f.modifiedMs, old.id);
          stats.moved++;
          continue;
        }

        const existed = byUri.has(f.uri);
        await db.runAsync(
          `INSERT INTO tracks (uri, title, artist, album, duration_ms, work_key, artist_key,
                               mbid, added_at, file_mtime, missing)
           VALUES (?,?,?,?,?,?,?,?,?,?,0)
           ON CONFLICT(uri) DO UPDATE SET
             title = excluded.title, artist = excluded.artist, album = excluded.album,
             work_key = excluded.work_key, artist_key = excluded.artist_key,
             mbid = COALESCE(excluded.mbid, mbid),
             file_mtime = excluded.file_mtime, missing = 0,
             embedding = CASE WHEN ABS(duration_ms - excluded.duration_ms) > 2000
                              THEN NULL ELSE embedding END,
             duration_ms = excluded.duration_ms`,
          f.uri, t.title, t.artist || 'Unknown Artist', t.album, t.durationMs,
          key, aKey, t.mbid, Date.now(), f.modifiedMs);
        existed ? stats.updated++ : stats.added++;
      }
    });

    done += chunk.length;
    onProgress?.(done, todo.length);
  }

  if (!signal?.aborted) {
    await db.withTransactionAsync(async () => {
      for (const id of revived) await db.runAsync('UPDATE tracks SET missing = 0 WHERE id = ?', id);
      for (const list of lostByKey.values())
        for (const r of list) {
          if (!r.missing) { await db.runAsync('UPDATE tracks SET missing = 1 WHERE id = ?', r.id); stats.missing++; }
        }
    });
  }
  return stats;
}

// ---------- helpers ----------

function resolveTags(f: RawFile, tg: Tags | null) {
  const fb = fromFilename(f.filename);
  return {
    title: (tg?.title ?? '').trim() || fb.title,
    artist: (tg?.artist ?? '').trim() || (tg?.albumArtist ?? '').trim() || fb.artist,
    album: (tg?.album ?? '').trim(),
    mbid: tg?.mbid ?? null,
    durationMs: tg?.durationMs ?? f.durationMs,
  };
}

function fromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/^\d{1,3}\s*[-._)]\s*/, '').replace(/_/g, ' ').trim();
  const parts = base.split(/\s+-\s+/);
  return parts.length >= 2
    ? { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() }
    : { artist: '', title: base || name };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

export async function markNotDuplicate(db: DbLike, a: string, b: string) {
  await db.runAsync('INSERT OR IGNORE INTO not_duplicates VALUES (?, ?)', a, b);
}
