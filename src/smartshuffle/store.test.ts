import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { makeDb } from './testDb';
import { recordPlay, loadLibrary, getRecentWorkKeys, toFloat32 } from './store';
import { migrate } from './schema';

function insert(raw: any, o: Record<string, any> = {}) {
  const r = {
    uri: '/m/a.mp3', title: 'Song', artist: 'Artist', album: 'Album', duration_ms: 200_000,
    work_key: 'song_artist', artist_key: 'artist', ...o,
  };
  return raw.prepare(
    `INSERT INTO tracks (uri,title,artist,album,duration_ms,work_key,artist_key,added_at)
     VALUES (?,?,?,?,?,?,?,0)`)
    .run(r.uri, r.title, r.artist, r.album, r.duration_ms, r.work_key, r.artist_key)
    .lastInsertRowid as number;
}
const track = (raw: any, id: number) => raw.prepare('SELECT * FROM tracks WHERE id = ?').get(id);

describe('recordPlay', () => {
  it('records a completion and updates counters and score', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    const out = await recordPlay(db, { trackId: id, secondsPlayed: 195, now: 5000 });
    expect(out).toBe('complete');
    expect(track(raw, id)).toMatchObject({ plays: 1, completions: 1, last_played_at: 5000 });
    expect(track(raw, id).score).toBeCloseTo(3 / 5, 10);
    expect(raw.prepare('SELECT outcome FROM plays').get().outcome).toBe('complete');
  });

  it('records an early skip and lowers the score', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    expect(await recordPlay(db, { trackId: id, secondsPlayed: 10 })).toBe('skip_early');
    expect(track(raw, id)).toMatchObject({ plays: 1, early_skips: 1, completions: 0 });
    expect(track(raw, id).score).toBeCloseTo(2 / 6.5, 10);
  });

  it('records a late skip', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    expect(await recordPlay(db, { trackId: id, secondsPlayed: 100 })).toBe('skip_late');
    expect(track(raw, id).late_skips).toBe(1);
  });

  it('counts the like bonus', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    raw.prepare('UPDATE tracks SET liked = 1').run();
    await recordPlay(db, { trackId: id, secondsPlayed: 195 });
    expect(track(raw, id).score).toBeCloseTo((2 + 1 + 2) / (4 + 1 + 2), 10);
  });

  it('stores prev_track_id and source', async () => {
    const { raw, db } = makeDb(); const a = insert(raw);
    const b = insert(raw, { uri: '/m/b.mp3', work_key: 'b_x' });
    await recordPlay(db, { trackId: b, secondsPlayed: 195, prevTrackId: a, source: 'shuffle' });
    expect(raw.prepare('SELECT prev_track_id, source FROM plays').get())
      .toEqual({ prev_track_id: a, source: 'shuffle' });
  });

  it('ignores an unknown track id', async () => {
    const { raw, db } = makeDb();
    expect(await recordPlay(db, { trackId: 999, secondsPlayed: 100 })).toBeNull();
    expect(raw.prepare('SELECT COUNT(*) AS n FROM plays').get().n).toBe(0);
  });
});

describe('toFloat32', () => {
  it('round-trips values', () => {
    const f = new Float32Array([0.6, 0.8, -0.25]);
    const out = toFloat32(new Uint8Array(f.buffer.slice(0)), 3)!;
    expect(Array.from(out)).toEqual(Array.from(f));
  });
  it('handles a view with an unaligned byteOffset', () => {
    const f = new Float32Array([1.5, -2.5]);
    const padded = new Uint8Array(1 + 8);
    padded.set(new Uint8Array(f.buffer), 1);
    const out = toFloat32(padded.subarray(1), 2)!;
    expect(Array.from(out)).toEqual([1.5, -2.5]);
  });
  it('rejects malformed blobs and dimension mismatches', () => {
    expect(toFloat32(new Uint8Array(7))).toBeUndefined();
    expect(toFloat32(new Uint8Array(0))).toBeUndefined();
    expect(toFloat32(new Uint8Array(new Float32Array([1, 2]).buffer), 3)).toBeUndefined();
  });
});

describe('loadLibrary', () => {
  it('excludes missing tracks and uses artist_key for the artist', async () => {
    const { raw, db } = makeDb();
    const a = insert(raw, { artist: 'The Beatles', artist_key: 'beatles' });
    const b = insert(raw, { uri: '/m/b.mp3', work_key: 'b_x' });
    raw.prepare('UPDATE tracks SET missing = 1 WHERE id = ?').run(b);
    const lib = await loadLibrary(db);
    expect(lib).toHaveLength(1);
    expect(lib[0]).toMatchObject({ id: a, artist: 'beatles', workKey: 'song_artist' });
    expect(lib[0].vec).toBeUndefined();
  });

  it('falls back to the raw artist when artist_key is null', async () => {
    const { raw, db } = makeDb();
    insert(raw, { artist: 'Raw Name', artist_key: null });
    expect((await loadLibrary(db))[0].artist).toBe('Raw Name');
  });

  it('decodes a stored embedding', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    const f = new Float32Array([0.6, 0.8]);
    raw.prepare('UPDATE tracks SET embedding = ?, embedding_dim = 2 WHERE id = ?')
      .run(Buffer.from(f.buffer), id);
    expect(Array.from((await loadLibrary(db))[0].vec!)).toEqual(Array.from(f));
  });

  it('drops an embedding whose dimension does not match', async () => {
    const { raw, db } = makeDb(); const id = insert(raw);
    raw.prepare('UPDATE tracks SET embedding = ?, embedding_dim = 5 WHERE id = ?')
      .run(Buffer.from(new Float32Array([1, 0]).buffer), id);
    expect((await loadLibrary(db))[0].vec).toBeUndefined();
  });
});

describe('getRecentWorkKeys', () => {
  it('returns distinct works, most recent first, respecting the limit', async () => {
    const { raw, db } = makeDb();
    const a = insert(raw, { work_key: 'w1' });
    const b = insert(raw, { uri: '/m/b.mp3', work_key: 'w2' });
    const ins = raw.prepare(
      `INSERT INTO plays (track_id, started_at, seconds_played, outcome) VALUES (?, ?, 100, 'complete')`);
    ins.run(a, 100); ins.run(b, 200); ins.run(a, 300);
    expect([...(await getRecentWorkKeys(db, 1))]).toEqual(['w1']);
    expect([...(await getRecentWorkKeys(db, 2))]).toEqual(['w1', 'w2']);
  });
});

describe('migrate', () => {
  it('creates the schema once and is safe to run twice', async () => {
    const raw = new Database(':memory:');
    const db: any = {
      execAsync: async (s: string) => { raw.exec(s); },
      getFirstAsync: async (s: string) => raw.prepare(s).get() ?? null,
    };
    await migrate(db);
    await migrate(db);
    const names = raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      .map((r: any) => r.name);
    expect(names).toEqual(expect.arrayContaining(['tracks', 'plays', 'not_duplicates', 'settings']));
    expect(raw.pragma('user_version', { simple: true })).toBe(1);
  });
});
